/**
 * Shared utilities for API route handlers.
 */

import {
  ACCESS_KEY_PREFIX,
  type AccessKeyScope,
  hashAccessKey
} from '@/lib/access-key'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { accessKeys } from '@/lib/db/schema'
import { and, eq, gt, isNull, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export class AuthError extends Error {
  constructor(
    message = 'Unauthorized',
    public readonly status = 401
  ) {
    super(message)
  }
}

/**
 * Resolves the authenticated user from either:
 * 1. An `Authorization: Bearer kagi_<token>` header (access key)
 * 2. A session cookie (browser / better-auth session)
 *
 * If `requiredScope` is provided and the request uses an access key that
 * does not include that scope, throws a 403 AuthError.
 *
 * Returns `{ user: { id } }` — compatible with all existing route usages
 * of `session.user.id`.
 */
export async function requireSession(requiredScope?: AccessKeyScope) {
  const allHeaders = await headers()
  const authHeader = allHeaders.get('authorization')

  let userId: string
  let scopes: string[] | null

  if (authHeader?.startsWith(`Bearer ${ACCESS_KEY_PREFIX}`)) {
    // ── Access key auth ──────────────────────────────────────────────────────
    const token = authHeader.slice(7)
    const hash = hashAccessKey(token)

    const [key] = await db
      .select()
      .from(accessKeys)
      .where(
        and(
          eq(accessKeys.keyHash, hash),
          or(isNull(accessKeys.expiresAt), gt(accessKeys.expiresAt, new Date()))
        )
      )
      .limit(1)

    if (!key) throw new AuthError('Invalid or expired access key')

    // Fire-and-forget lastUsedAt update — don't await, don't block the request
    db.update(accessKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(accessKeys.id, key.id))
      .catch(() => {})

    userId = key.userId
    scopes = key.scopes
  } else {
    // ── Session cookie auth ──────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: allHeaders })
    if (!session) throw new AuthError()
    userId = session.user.id
    scopes = null // null = full access (no scope restriction for browser sessions)
  }

  if (requiredScope && scopes !== null && !scopes.includes(requiredScope)) {
    throw new AuthError(
      `Insufficient permissions: '${requiredScope}' scope required`,
      403
    )
  }

  return { user: { id: userId } }
}

/**
 * Wraps a route handler, catching auth errors and returning proper responses.
 * Uses a loose return type so callers can return any NextResponse shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withAuth(handler: () => Promise<NextResponse<any>>) {
  try {
    return await handler()
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[API Error]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Standard JSON error response. */
export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
