import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { twoFactorTokens } from '@/lib/db/schema'
import { encryptJson } from '@/lib/encryption'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  service: z.string().min(1).max(255).optional(),
  label: z.string().max(255).optional().nullable(),
  tokens: z.array(z.string().min(1)).min(1).optional(),
  usedCount: z.number().int().min(0).optional()
})

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    const session = await requireSession()
    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) return apiError(parsed.error.message)

    const { tokens, ...rest } = parsed.data
    const updates: Partial<typeof twoFactorTokens.$inferInsert> = {
      ...rest,
      updatedAt: new Date()
    }

    if (tokens) {
      updates.encryptedTokens = encryptJson(tokens)
      updates.totalCount = tokens.length
    }

    const [updated] = await db
      .update(twoFactorTokens)
      .set(updates)
      .where(
        and(
          eq(twoFactorTokens.id, id),
          eq(twoFactorTokens.userId, session.user.id)
        )
      )
      .returning()

    if (!updated) return apiError('2FA token set not found', 404)

    const { encryptedTokens: _et, ...safeRow } = updated
    return NextResponse.json({ data: safeRow })
  })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    const session = await requireSession()
    const { id } = await params

    const [deleted] = await db
      .delete(twoFactorTokens)
      .where(
        and(
          eq(twoFactorTokens.id, id),
          eq(twoFactorTokens.userId, session.user.id)
        )
      )
      .returning()

    if (!deleted) return apiError('2FA token set not found', 404)

    return NextResponse.json({ data: { id } })
  })
}
