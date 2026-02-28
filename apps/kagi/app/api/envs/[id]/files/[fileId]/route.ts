import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { envFiles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  return withAuth(async () => {
    const session = await requireSession('envs:write')
    const { fileId } = await params

    const [existing] = await db
      .select({ id: envFiles.id })
      .from(envFiles)
      .where(
        and(eq(envFiles.id, fileId), eq(envFiles.userId, session.user.id))
      )
      .limit(1)

    if (!existing) return apiError('Not found', 404)

    await db.delete(envFiles).where(eq(envFiles.id, fileId))

    return NextResponse.json({ data: { success: true } })
  })
}
