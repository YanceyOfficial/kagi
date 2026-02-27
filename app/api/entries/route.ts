import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { keyCategories, keyEntries } from '@/lib/db/schema'
import { encrypt, encryptJson } from '@/lib/encryption'
import { and, eq, ilike, or } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  categoryId: z.string().uuid(),
  projectName: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  environment: z
    .enum(['production', 'staging', 'development', 'local'])
    .default('production'),
  // For 'simple': plain string
  // For 'group': key-value map
  // For 'ssh'/'json': file content as string (Base64 or raw text)
  value: z.union([z.string(), z.record(z.string(), z.string())]),
  fileName: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  expiresAt: z.string().datetime().optional()
})

export async function GET(request: NextRequest) {
  return withAuth(async () => {
    const session = await requireSession()
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')

    // Build the base query joining with categories to enforce ownership
    const conditions = [eq(keyCategories.userId, session.user.id)]

    if (categoryId) {
      conditions.push(eq(keyEntries.categoryId, categoryId))
    }
    if (search) {
      conditions.push(
        or(
          ilike(keyEntries.projectName, `%${search}%`),
          ilike(keyEntries.notes, `%${search}%`)
        )!
      )
    }

    const rows = await db
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
          iconSlug: keyCategories.iconSlug,
          iconUrl: keyCategories.iconUrl,
          color: keyCategories.color
        }
      })
      .from(keyEntries)
      .innerJoin(keyCategories, eq(keyEntries.categoryId, keyCategories.id))
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

    const {
      categoryId,
      projectName,
      description,
      environment,
      value,
      fileName,
      notes,
      expiresAt
    } = parsed.data

    // Verify the category belongs to the current user
    const [category] = await db
      .select()
      .from(keyCategories)
      .where(
        and(
          eq(keyCategories.id, categoryId),
          eq(keyCategories.userId, session.user.id)
        )
      )

    if (!category) return apiError('Category not found', 404)

    // Encrypt the value based on key type
    let encryptedValue: string
    if (typeof value === 'string') {
      encryptedValue = encrypt(value)
    } else {
      encryptedValue = encryptJson(value)
    }

    const [row] = await db
      .insert(keyEntries)
      .values({
        categoryId,
        projectName,
        description: description ?? null,
        environment,
        encryptedValue,
        fileName: fileName ?? null,
        notes: notes ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      })
      .returning()

    // Return without encrypted value
    const { encryptedValue: _ev, ...safeRow } = row

    return NextResponse.json({ data: safeRow }, { status: 201 })
  })
}
