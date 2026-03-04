import { requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { keyCategories, keyEntries } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

// Returns all distinct project names owned by the current user, sorted
// alphabetically. Used to populate the project name combobox in the
// create/edit entry dialog so users don't have to retype shared names.
// keyEntries has no userId column — ownership is via categoryId → keyCategories.userId.
export async function GET() {
  return withAuth(async () => {
    const session = await requireSession('entries:read')

    const rows = await db
      .select({ projectName: keyEntries.projectName })
      .from(keyEntries)
      .innerJoin(keyCategories, eq(keyEntries.categoryId, keyCategories.id))
      .where(eq(keyCategories.userId, session.user.id))
      .groupBy(keyEntries.projectName)
      .orderBy(asc(keyEntries.projectName))

    return NextResponse.json({ data: rows.map((r) => r.projectName) })
  })
}
