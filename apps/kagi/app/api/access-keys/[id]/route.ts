import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { accessKeys } from '@/lib/db/schema'
import { ErrorCode } from '@/lib/error-codes'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    const session = await requireSession()
    const { id } = await params

    const [deleted] = await db
      .delete(accessKeys)
      .where(and(eq(accessKeys.id, id), eq(accessKeys.userId, session.user.id)))
      .returning({ id: accessKeys.id })

    if (!deleted)
      return apiError(
        'Access key not found',
        404,
        ErrorCode.ACCESS_KEY_NOT_FOUND
      )
    return NextResponse.json({ data: { id: deleted.id } })
  })
}
