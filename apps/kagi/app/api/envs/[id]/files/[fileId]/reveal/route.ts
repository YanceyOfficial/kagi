import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { envFiles } from '@/lib/db/schema'
import { decrypt } from '@/lib/encryption'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  return withAuth(async () => {
    const session = await requireSession('envs:reveal')
    const { fileId } = await params

    const [file] = await db
      .select()
      .from(envFiles)
      .where(
        and(eq(envFiles.id, fileId), eq(envFiles.userId, session.user.id))
      )
      .limit(1)

    if (!file) return apiError('Not found', 404)

    const content = decrypt(file.encryptedContent)

    return NextResponse.json({
      data: {
        id: file.id,
        projectId: file.projectId,
        fileType: file.fileType,
        content
      }
    })
  })
}
