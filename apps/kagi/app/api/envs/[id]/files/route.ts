import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { envFiles, envProjects } from '@/lib/db/schema'
import { encrypt } from '@/lib/encryption'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const saveSchema = z.object({
  fileType: z.enum(['env', 'env.local', 'env.production', 'env.development']),
  content: z.string().min(1)
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async () => {
    const session = await requireSession('envs:read')
    const { id } = await params

    const [project] = await db
      .select({ id: envProjects.id })
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
        and(
          eq(envFiles.projectId, id),
          eq(envFiles.userId, session.user.id)
        )
      )

    return NextResponse.json({ data: files })
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async () => {
    const session = await requireSession('envs:write')
    const { id } = await params
    const body = await request.json()
    const parsed = saveSchema.safeParse(body)

    if (!parsed.success) {
      return apiError(parsed.error.message)
    }

    const [project] = await db
      .select({ id: envProjects.id })
      .from(envProjects)
      .where(
        and(eq(envProjects.id, id), eq(envProjects.userId, session.user.id))
      )
      .limit(1)

    if (!project) return apiError('Not found', 404)

    const encryptedContent = encrypt(parsed.data.content)

    const [row] = await db
      .insert(envFiles)
      .values({
        projectId: id,
        userId: session.user.id,
        fileType: parsed.data.fileType,
        encryptedContent
      })
      .onConflictDoUpdate({
        target: [envFiles.projectId, envFiles.fileType],
        set: {
          encryptedContent,
          updatedAt: new Date()
        }
      })
      .returning({
        id: envFiles.id,
        projectId: envFiles.projectId,
        userId: envFiles.userId,
        fileType: envFiles.fileType,
        createdAt: envFiles.createdAt,
        updatedAt: envFiles.updatedAt
      })

    return NextResponse.json({ data: row }, { status: 201 })
  })
}
