import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { keyCategories, keyEntries } from '@/lib/db/schema'
import { and, count, eq, ilike, or } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  iconUrl: z.string().url().optional().or(z.literal('')),
  iconSlug: z.string().max(50).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  keyType: z.enum(['simple', 'group', 'ssh', 'json']),
  envVarName: z.string().max(255).optional(),
  fieldDefinitions: z.array(z.string().min(1)).optional()
})

export async function GET(request: NextRequest) {
  return withAuth(async () => {
    const session = await requireSession('categories:read')
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const conditions = [eq(keyCategories.userId, session.user.id)]
    if (search) {
      conditions.push(
        or(
          ilike(keyCategories.name, `%${search}%`),
          ilike(keyCategories.description, `%${search}%`)
        )!
      )
    }

    const rows = await db
      .select({
        id: keyCategories.id,
        userId: keyCategories.userId,
        name: keyCategories.name,
        description: keyCategories.description,
        iconUrl: keyCategories.iconUrl,
        iconSlug: keyCategories.iconSlug,
        color: keyCategories.color,
        keyType: keyCategories.keyType,
        envVarName: keyCategories.envVarName,
        fieldDefinitions: keyCategories.fieldDefinitions,
        createdAt: keyCategories.createdAt,
        updatedAt: keyCategories.updatedAt,
        entryCount: count(keyEntries.id)
      })
      .from(keyCategories)
      .leftJoin(keyEntries, eq(keyEntries.categoryId, keyCategories.id))
      .where(and(...conditions))
      .groupBy(keyCategories.id)

    return NextResponse.json({ data: rows })
  })
}

export async function POST(request: NextRequest) {
  return withAuth(async () => {
    const session = await requireSession('categories:write')
    const body = await request.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return apiError(parsed.error.message)
    }

    const {
      name,
      description,
      iconUrl,
      iconSlug,
      color,
      keyType,
      envVarName,
      fieldDefinitions
    } = parsed.data

    // Validate type-specific fields
    if (keyType === 'simple' && !envVarName) {
      return apiError('envVarName is required for simple key type')
    }
    if (
      keyType === 'group' &&
      (!fieldDefinitions || fieldDefinitions.length === 0)
    ) {
      return apiError('fieldDefinitions are required for group key type')
    }

    const [row] = await db
      .insert(keyCategories)
      .values({
        userId: session.user.id,
        name,
        description: description ?? null,
        iconUrl: iconUrl || null,
        iconSlug: iconSlug ?? null,
        color: color ?? null,
        keyType,
        envVarName: envVarName ?? null,
        fieldDefinitions: fieldDefinitions ?? null
      })
      .returning()

    return NextResponse.json({ data: row }, { status: 201 })
  })
}
