import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { keyCategories, keyEntries } from '@/lib/db/schema'
import { encrypt, encryptJson } from '@/lib/encryption'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  projectName: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  environment: z
    .enum(['production', 'staging', 'development', 'local'])
    .optional(),
  value: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
  fileName: z.string().max(255).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable()
})

type RouteParams = { params: Promise<{ id: string }> }

async function getEntryWithOwnership(entryId: string, userId: string) {
  const [row] = await db
    .select({
      entry: keyEntries,
      category: keyCategories
    })
    .from(keyEntries)
    .innerJoin(keyCategories, eq(keyEntries.categoryId, keyCategories.id))
    .where(and(eq(keyEntries.id, entryId), eq(keyCategories.userId, userId)))
  return row
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    const session = await requireSession()
    const { id } = await params

    const row = await getEntryWithOwnership(id, session.user.id)
    if (!row) return apiError('Entry not found', 404)

    const { encryptedValue: _ev, ...safeEntry } = row.entry

    return NextResponse.json({
      data: { ...safeEntry, category: row.category }
    })
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    const session = await requireSession()
    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) return apiError(parsed.error.message)

    const row = await getEntryWithOwnership(id, session.user.id)
    if (!row) return apiError('Entry not found', 404)

    const { value, expiresAt, ...rest } = parsed.data
    const updates: Partial<typeof keyEntries.$inferInsert> = {
      ...rest,
      updatedAt: new Date()
    }

    if (value !== undefined) {
      updates.encryptedValue =
        typeof value === 'string' ? encrypt(value) : encryptJson(value)
    }
    if (expiresAt !== undefined) {
      updates.expiresAt = expiresAt ? new Date(expiresAt) : null
    }

    const [updated] = await db
      .update(keyEntries)
      .set(updates)
      .where(eq(keyEntries.id, id))
      .returning()

    const { encryptedValue: _ev, ...safeEntry } = updated
    return NextResponse.json({ data: safeEntry })
  })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    const session = await requireSession()
    const { id } = await params

    const row = await getEntryWithOwnership(id, session.user.id)
    if (!row) return apiError('Entry not found', 404)

    await db.delete(keyEntries).where(eq(keyEntries.id, id))

    return NextResponse.json({ data: { id } })
  })
}
