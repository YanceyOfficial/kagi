import { requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { keyCategories, twoFactorTokens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

// DELETE /api/account/data — wipe all key categories, entries, and 2FA tokens for the user.
// keyEntries and twoFactorTokens cascade from their parent tables/user.
export async function DELETE() {
  return withAuth(async () => {
    const session = await requireSession()
    const userId = session.user.id

    await db.delete(keyCategories).where(eq(keyCategories.userId, userId))
    await db.delete(twoFactorTokens).where(eq(twoFactorTokens.userId, userId))

    return NextResponse.json({ data: { ok: true } })
  })
}
