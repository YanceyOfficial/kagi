import { requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { keyCategories, keyEntries, twoFactorTokens } from '@/lib/db/schema'
import { and, count, eq, gt, lt } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  return withAuth(async () => {
    const session = await requireSession()
    const userId = session.user.id
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const [
      categoryCounts,
      entryCounts,
      twoFaCounts,
      keyTypeBreakdown,
      envBreakdown,
      recentEntries,
      expiringEntries
    ] = await Promise.all([
      // Total categories
      db
        .select({ count: count() })
        .from(keyCategories)
        .where(eq(keyCategories.userId, userId)),

      // Total entries (join through categories)
      db
        .select({ count: count() })
        .from(keyEntries)
        .innerJoin(keyCategories, eq(keyEntries.categoryId, keyCategories.id))
        .where(eq(keyCategories.userId, userId)),

      // Total 2FA token sets
      db
        .select({ count: count() })
        .from(twoFactorTokens)
        .where(eq(twoFactorTokens.userId, userId)),

      // Key type breakdown
      db
        .select({ keyType: keyCategories.keyType, count: count() })
        .from(keyCategories)
        .where(eq(keyCategories.userId, userId))
        .groupBy(keyCategories.keyType),

      // Environment breakdown
      db
        .select({ environment: keyEntries.environment, count: count() })
        .from(keyEntries)
        .innerJoin(keyCategories, eq(keyEntries.categoryId, keyCategories.id))
        .where(eq(keyCategories.userId, userId))
        .groupBy(keyEntries.environment),

      // 5 most recently added entries
      db
        .select({
          id: keyEntries.id,
          categoryId: keyEntries.categoryId,
          projectName: keyEntries.projectName,
          description: keyEntries.description,
          environment: keyEntries.environment,
          fileName: keyEntries.fileName,
          notes: keyEntries.notes,
          createdAt: keyEntries.createdAt,
          updatedAt: keyEntries.updatedAt,
          expiresAt: keyEntries.expiresAt,
          category: {
            id: keyCategories.id,
            name: keyCategories.name,
            keyType: keyCategories.keyType,
            envVarName: keyCategories.envVarName,
            fieldDefinitions: keyCategories.fieldDefinitions,
            iconEmoji: keyCategories.iconEmoji,
            iconUrl: keyCategories.iconUrl,
            color: keyCategories.color
          }
        })
        .from(keyEntries)
        .innerJoin(keyCategories, eq(keyEntries.categoryId, keyCategories.id))
        .where(eq(keyCategories.userId, userId))
        .orderBy(keyEntries.createdAt)
        .limit(5),

      // Entries expiring within 30 days
      db
        .select({
          id: keyEntries.id,
          categoryId: keyEntries.categoryId,
          projectName: keyEntries.projectName,
          description: keyEntries.description,
          environment: keyEntries.environment,
          fileName: keyEntries.fileName,
          notes: keyEntries.notes,
          createdAt: keyEntries.createdAt,
          updatedAt: keyEntries.updatedAt,
          expiresAt: keyEntries.expiresAt,
          category: {
            id: keyCategories.id,
            name: keyCategories.name,
            keyType: keyCategories.keyType,
            envVarName: keyCategories.envVarName,
            fieldDefinitions: keyCategories.fieldDefinitions,
            iconEmoji: keyCategories.iconEmoji,
            iconUrl: keyCategories.iconUrl,
            color: keyCategories.color
          }
        })
        .from(keyEntries)
        .innerJoin(keyCategories, eq(keyEntries.categoryId, keyCategories.id))
        .where(
          and(
            eq(keyCategories.userId, userId),
            gt(keyEntries.expiresAt, now),
            lt(keyEntries.expiresAt, thirtyDaysFromNow)
          )
        )
        .orderBy(keyEntries.expiresAt)
        .limit(10)
    ])

    return NextResponse.json({
      data: {
        totalCategories: categoryCounts[0]?.count ?? 0,
        totalEntries: entryCounts[0]?.count ?? 0,
        totalTwoFactorSets: twoFaCounts[0]?.count ?? 0,
        keyTypeBreakdown: keyTypeBreakdown.map((r) => ({
          type: r.keyType,
          count: Number(r.count)
        })),
        environmentBreakdown: envBreakdown.map((r) => ({
          environment: r.environment,
          count: Number(r.count)
        })),
        recentEntries,
        expiringEntries
      }
    })
  })
}
