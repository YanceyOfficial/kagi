import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { keyCategories, keyEntries } from '@/lib/db/schema'
import { decrypt, decryptJson } from '@/lib/encryption'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    const session = await requireSession()
    const { id } = await params

    const [row] = await db
      .select({
        entry: keyEntries,
        category: keyCategories
      })
      .from(keyEntries)
      .innerJoin(keyCategories, eq(keyEntries.categoryId, keyCategories.id))
      .where(
        and(eq(keyEntries.id, id), eq(keyCategories.userId, session.user.id))
      )

    if (!row) return apiError('Entry not found', 404)

    const { entry, category } = row
    const keyType = category.keyType

    let value: string | Record<string, string>

    if (keyType === 'group') {
      value = decryptJson<Record<string, string>>(entry.encryptedValue)
    } else {
      value = decrypt(entry.encryptedValue)
    }

    return NextResponse.json({
      data: {
        id: entry.id,
        keyType,
        value,
        envVarName: category.envVarName,
        fieldDefinitions: category.fieldDefinitions,
        fileName: entry.fileName
      }
    })
  })
}
