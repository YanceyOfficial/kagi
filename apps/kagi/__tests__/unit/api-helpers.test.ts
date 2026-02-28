import { AuthError, withAuth } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

// Minimal mock so NextResponse.json works in vitest (no browser/edge runtime needed)
vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      ({ _body: data, _status: (init as { status?: number })?.status ?? 200 }) as unknown as Response
  }
}))

// We also need to mock the imports that api-helpers pulls in from Next.js/DB
vi.mock('next/headers', () => ({ headers: vi.fn() }))
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))
vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/db/schema', () => ({ accessKeys: {} }))
vi.mock('drizzle-orm', () => ({
  and: vi.fn(),
  eq: vi.fn(),
  gt: vi.fn(),
  isNull: vi.fn(),
  or: vi.fn()
}))

// Helper to extract body/status from mocked NextResponse
function unwrap(res: unknown) {
  const r = res as { _body: unknown; _status: number }
  return { body: r._body, status: r._status }
}

describe('AuthError', () => {
  it('defaults to message "Unauthorized" and status 401', () => {
    const err = new AuthError()
    expect(err.message).toBe('Unauthorized')
    expect(err.status).toBe(401)
  })

  it('accepts a custom message', () => {
    const err = new AuthError('Access denied')
    expect(err.message).toBe('Access denied')
    expect(err.status).toBe(401)
  })

  it('accepts a custom status code', () => {
    const err = new AuthError('Forbidden', 403)
    expect(err.message).toBe('Forbidden')
    expect(err.status).toBe(403)
  })

  it('is an instance of Error', () => {
    expect(new AuthError()).toBeInstanceOf(Error)
  })
})

describe('withAuth', () => {
  it('returns the handler result on success', async () => {
    const mockResponse = NextResponse.json({ ok: true })
    const res = await withAuth(async () => mockResponse)
    const { body, status } = unwrap(res)
    expect(body).toEqual({ ok: true })
    expect(status).toBe(200)
  })

  it('returns 401 when handler throws AuthError with default args', async () => {
    const res = await withAuth(async () => {
      throw new AuthError()
    })
    const { body, status } = unwrap(res)
    expect(status).toBe(401)
    expect(body).toEqual({ error: 'Unauthorized' })
  })

  it('returns 403 when handler throws AuthError with status 403', async () => {
    const res = await withAuth(async () => {
      throw new AuthError('Insufficient permissions: scope required', 403)
    })
    const { body, status } = unwrap(res)
    expect(status).toBe(403)
    expect((body as { error: string }).error).toContain('Insufficient permissions')
  })

  it('returns 500 when handler throws a generic Error', async () => {
    const res = await withAuth(async () => {
      throw new Error('DB connection failed')
    })
    const { body, status } = unwrap(res)
    expect(status).toBe(500)
    expect(body).toEqual({ error: 'DB connection failed' })
  })

  it('returns 500 with fallback message when handler throws a non-Error', async () => {
    const res = await withAuth(async () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 'string error'
    })
    const { body, status } = unwrap(res)
    expect(status).toBe(500)
    expect(body).toEqual({ error: 'Internal server error' })
  })
})
