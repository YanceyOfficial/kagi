/**
 * Shared utilities for API route handlers.
 */

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

/** Returns the current session or throws a 401 NextResponse. */
export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    throw new AuthError()
  }
  return session
}

export class AuthError extends Error {
  constructor() {
    super('Unauthorized')
  }
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
