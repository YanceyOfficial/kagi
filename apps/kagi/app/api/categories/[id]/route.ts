import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { keyCategories } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  iconUrl: z.string().url().optional().nullable().or(z.literal('')),
  iconSlug: z.string().max(50).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .nullable(),
  envVarName: z.string().max(255).optional().nullable(),
  fieldDefinitions: z.array(z.string().min(1)).optional().nullable()
})

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    const session = await requireSession()
    const { id } = await params

    const [row] = await db
      .select()
      .from(keyCategories)
      .where(
        and(eq(keyCategories.id, id), eq(keyCategories.userId, session.user.id))
      )

    if (!row) return apiError('Category not found', 404)

    return NextResponse.json({ data: row })
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    const session = await requireSession()
    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) return apiError(parsed.error.message)

    const data = parsed.data

    const [updated] = await db
      .update(keyCategories)
      .set({
        ...data,
        iconUrl: data.iconUrl === '' ? null : data.iconUrl,
        updatedAt: new Date()
      })
      .where(
        and(eq(keyCategories.id, id), eq(keyCategories.userId, session.user.id))
      )
      .returning()

    if (!updated) return apiError('Category not found', 404)

    return NextResponse.json({ data: updated })
  })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    const session = await requireSession()
    const { id } = await params

    const [deleted] = await db
      .delete(keyCategories)
      .where(
        and(eq(keyCategories.id, id), eq(keyCategories.userId, session.user.id))
      )
      .returning()

    if (!deleted) return apiError('Category not found', 404)

    return NextResponse.json({ data: { id } })
  })
}
