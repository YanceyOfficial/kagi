import { SiteHeader } from '@/components/layout/site-header'
import { SettingsClient } from '@/components/settings/settings-client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { keyCategories, keyEntries, twoFactorTokens } from '@/lib/db/schema'
import { count, eq } from 'drizzle-orm'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const userId = session.user.id

  const [[catRow], [entryRow], [twoFaRow]] = await Promise.all([
    db
      .select({ count: count() })
      .from(keyCategories)
      .where(eq(keyCategories.userId, userId)),
    db
      .select({ count: count() })
      .from(keyEntries)
      .innerJoin(keyCategories, eq(keyEntries.categoryId, keyCategories.id))
      .where(eq(keyCategories.userId, userId)),
    db
      .select({ count: count() })
      .from(twoFactorTokens)
      .where(eq(twoFactorTokens.userId, userId))
  ])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader title="Settings" />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <SettingsClient
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image ?? null,
            // better-auth includes createdAt on the user object from DB
            createdAt:
              ((session.user as Record<string, unknown>).createdAt as Date) ??
              new Date()
          }}
          stats={{
            categories: catRow.count,
            entries: entryRow.count,
            twoFaSets: twoFaRow.count
          }}
        />
      </div>
    </div>
  )
}
