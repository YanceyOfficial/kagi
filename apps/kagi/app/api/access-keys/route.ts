import { ALL_SCOPES, generateAccessKey } from '@/lib/access-key'
import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { accessKeys } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(255),
  scopes: z.array(z.enum(ALL_SCOPES)).min(1),
  expiresAt: z.string().datetime().optional()
})

const safeFields = {
  id: accessKeys.id,
  name: accessKeys.name,
  keyPrefix: accessKeys.keyPrefix,
  scopes: accessKeys.scopes,
  lastUsedAt: accessKeys.lastUsedAt,
  expiresAt: accessKeys.expiresAt,
  createdAt: accessKeys.createdAt
}

export async function GET() {
  return withAuth(async () => {
    const session = await requireSession()
    const rows = await db
      .select(safeFields)
      .from(accessKeys)
      .where(eq(accessKeys.userId, session.user.id))
      .orderBy(asc(accessKeys.createdAt))
    return NextResponse.json({ data: rows })
  })
}

export async function POST(req: NextRequest) {
  return withAuth(async () => {
    const session = await requireSession()
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0].message)

    const { name, scopes, expiresAt } = parsed.data
    const { key, hash, keyPrefix } = generateAccessKey()

    const [created] = await db
      .insert(accessKeys)
      .values({
        userId: session.user.id,
        name,
        keyHash: hash,
        keyPrefix,
        scopes,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      })
      .returning(safeFields)

    // key is returned once — never retrievable again
    return NextResponse.json({ data: { ...created, key } }, { status: 201 })
  })
}
