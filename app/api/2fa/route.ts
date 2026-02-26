import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { twoFactorTokens } from '@/lib/db/schema'
import { encryptJson } from '@/lib/encryption'
import { and, eq, ilike, or } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  service: z.string().min(1).max(255),
  label: z.string().max(255).optional(),
  tokens: z
    .array(z.string().min(1))
    .min(1, 'At least one recovery token is required')
})

export async function GET(request: NextRequest) {
  return withAuth(async () => {
    const session = await requireSession()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const conditions = [eq(twoFactorTokens.userId, session.user.id)]
    if (search) {
      conditions.push(
        or(
          ilike(twoFactorTokens.service, `%${search}%`),
          ilike(twoFactorTokens.label, `%${search}%`)
        )!
      )
    }

    const rows = await db
      .select({
        id: twoFactorTokens.id,
        userId: twoFactorTokens.userId,
        service: twoFactorTokens.service,
        label: twoFactorTokens.label,
        totalCount: twoFactorTokens.totalCount,
        usedCount: twoFactorTokens.usedCount,
        createdAt: twoFactorTokens.createdAt,
        updatedAt: twoFactorTokens.updatedAt
      })
      .from(twoFactorTokens)
      .where(and(...conditions))

    return NextResponse.json({ data: rows })
  })
}

export async function POST(request: NextRequest) {
  return withAuth(async () => {
    const session = await requireSession()
    const body = await request.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) return apiError(parsed.error.message)

    const { service, label, tokens } = parsed.data

    const [row] = await db
      .insert(twoFactorTokens)
      .values({
        userId: session.user.id,
        service,
        label: label ?? null,
        encryptedTokens: encryptJson(tokens),
        totalCount: tokens.length,
        usedCount: 0
      })
      .returning()

    const { encryptedTokens: _et, ...safeRow } = row
    return NextResponse.json({ data: safeRow }, { status: 201 })
  })
}
