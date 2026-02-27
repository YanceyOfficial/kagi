import { requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { keyCategories, keyEntries, twoFactorTokens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  return withAuth(async () => {
    const session = await requireSession()
    const userId = session.user.id

    const categories = await db
      .select({
        id: keyCategories.id,
        name: keyCategories.name,
        description: keyCategories.description,
        keyType: keyCategories.keyType,
        envVarName: keyCategories.envVarName,
        fieldDefinitions: keyCategories.fieldDefinitions,
        iconSlug: keyCategories.iconSlug,
        createdAt: keyCategories.createdAt
      })
      .from(keyCategories)
      .where(eq(keyCategories.userId, userId))

    const entries = await db
      .select({
        id: keyEntries.id,
        categoryId: keyEntries.categoryId,
        projectName: keyEntries.projectName,
        description: keyEntries.description,
        environment: keyEntries.environment,
        fileName: keyEntries.fileName,
        notes: keyEntries.notes,
        expiresAt: keyEntries.expiresAt,
        createdAt: keyEntries.createdAt
      })
      .from(keyEntries)
      .innerJoin(keyCategories, eq(keyEntries.categoryId, keyCategories.id))
      .where(eq(keyCategories.userId, userId))

    const twoFa = await db
      .select({
        service: twoFactorTokens.service,
        label: twoFactorTokens.label,
        totalCount: twoFactorTokens.totalCount,
        usedCount: twoFactorTokens.usedCount,
        createdAt: twoFactorTokens.createdAt
      })
      .from(twoFactorTokens)
      .where(eq(twoFactorTokens.userId, userId))

    const entriesByCategory = new Map<string, typeof entries>()
    for (const entry of entries) {
      const list = entriesByCategory.get(entry.categoryId) ?? []
      list.push(entry)
      entriesByCategory.set(entry.categoryId, list)
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      version: '1',
      user: { name: session.user.name, email: session.user.email },
      categories: categories.map((cat) => ({
        name: cat.name,
        description: cat.description,
        keyType: cat.keyType,
        envVarName: cat.envVarName,
        fieldDefinitions: cat.fieldDefinitions,
        iconSlug: cat.iconSlug,
        createdAt: cat.createdAt,
        entries: (entriesByCategory.get(cat.id) ?? []).map((e) => ({
          projectName: e.projectName,
          description: e.description,
          environment: e.environment,
          fileName: e.fileName,
          notes: e.notes,
          expiresAt: e.expiresAt,
          createdAt: e.createdAt
        }))
      })),
      twoFactorSets: twoFa
    }

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="kagi-export-${new Date().toISOString().slice(0, 10)}.json"`
      }
    })
  })
}
