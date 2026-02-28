import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { envFiles, envProjects } from '@/lib/db/schema'
import { and, count, eq, ilike, or } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional()
})

export async function GET(request: NextRequest) {
  return withAuth(async () => {
    const session = await requireSession('envs:read')
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const conditions = [eq(envProjects.userId, session.user.id)]
    if (search) {
      conditions.push(
        or(
          ilike(envProjects.name, `%${search}%`),
          ilike(envProjects.description, `%${search}%`)
        )!
      )
    }

    const rows = await db
      .select({
        id: envProjects.id,
        userId: envProjects.userId,
        name: envProjects.name,
        description: envProjects.description,
        createdAt: envProjects.createdAt,
        updatedAt: envProjects.updatedAt,
        fileCount: count(envFiles.id)
      })
      .from(envProjects)
      .leftJoin(envFiles, eq(envFiles.projectId, envProjects.id))
      .where(and(...conditions))
      .groupBy(envProjects.id)

    return NextResponse.json({ data: rows })
  })
}

export async function POST(request: NextRequest) {
  return withAuth(async () => {
    const session = await requireSession('envs:write')
    const body = await request.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return apiError(parsed.error.message)
    }

    const [row] = await db
      .insert(envProjects)
      .values({
        userId: session.user.id,
        name: parsed.data.name,
        description: parsed.data.description ?? null
      })
      .returning()

    return NextResponse.json({ data: row }, { status: 201 })
  })
}
