import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { envFiles, envProjects } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable()
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async () => {
    const session = await requireSession('envs:read')
    const { id } = await params

    const [project] = await db
      .select()
      .from(envProjects)
      .where(
        and(eq(envProjects.id, id), eq(envProjects.userId, session.user.id))
      )
      .limit(1)

    if (!project) return apiError('Not found', 404)

    const files = await db
      .select({
        id: envFiles.id,
        projectId: envFiles.projectId,
        userId: envFiles.userId,
        fileType: envFiles.fileType,
        createdAt: envFiles.createdAt,
        updatedAt: envFiles.updatedAt
      })
      .from(envFiles)
      .where(
        and(eq(envFiles.projectId, id), eq(envFiles.userId, session.user.id))
      )

    return NextResponse.json({ data: { ...project, files } })
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async () => {
    const session = await requireSession('envs:write')
    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return apiError(parsed.error.message)
    }

    const [existing] = await db
      .select({ id: envProjects.id })
      .from(envProjects)
      .where(
        and(eq(envProjects.id, id), eq(envProjects.userId, session.user.id))
      )
      .limit(1)

    if (!existing) return apiError('Not found', 404)

    const updates: Partial<typeof envProjects.$inferInsert> = {
      updatedAt: new Date()
    }
    if (parsed.data.name !== undefined) updates.name = parsed.data.name
    if ('description' in parsed.data)
      updates.description = parsed.data.description ?? null

    const [updated] = await db
      .update(envProjects)
      .set(updates)
      .where(eq(envProjects.id, id))
      .returning()

    return NextResponse.json({ data: updated })
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async () => {
    const session = await requireSession('envs:write')
    const { id } = await params

    const [existing] = await db
      .select({ id: envProjects.id })
      .from(envProjects)
      .where(
        and(eq(envProjects.id, id), eq(envProjects.userId, session.user.id))
      )
      .limit(1)

    if (!existing) return apiError('Not found', 404)

    await db.delete(envProjects).where(eq(envProjects.id, id))

    return NextResponse.json({ data: { success: true } })
  })
}
