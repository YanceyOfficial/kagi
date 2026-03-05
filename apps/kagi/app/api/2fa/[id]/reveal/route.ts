import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { twoFactorTokens } from '@/lib/db/schema'
import { decryptJson, encryptJson } from '@/lib/encryption'
import { ErrorCode } from '@/lib/error-codes'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    const session = await requireSession('2fa:reveal')
    const { id } = await params

    const [row] = await db
      .select()
      .from(twoFactorTokens)
      .where(
        and(
          eq(twoFactorTokens.id, id),
          eq(twoFactorTokens.userId, session.user.id)
        )
      )

    if (!row)
      return apiError(
        '2FA token set not found',
        404,
        ErrorCode.TWO_FACTOR_NOT_FOUND
      )

    const tokens = decryptJson<string[]>(row.encryptedTokens)

    if (tokens.length === 0)
      return apiError('No codes remaining', 400, ErrorCode.VALIDATION_ERROR)

    const [token, ...remaining] = tokens

    await db
      .update(twoFactorTokens)
      .set({
        encryptedTokens: encryptJson(remaining),
        usedCount: row.usedCount + 1,
        updatedAt: new Date()
      })
      .where(eq(twoFactorTokens.id, id))

    return NextResponse.json({
      data: {
        id: row.id,
        service: row.service,
        token,
        remaining: remaining.length
      }
    })
  })
}
