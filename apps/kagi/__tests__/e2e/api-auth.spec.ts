/**
 * API authentication guard tests.
 * All protected API routes must return 401 when called without a session,
 * with a JSON body of { error: "Unauthorized" }.
 */
import { expect, test } from '@playwright/test'

interface RouteSpec {
  method: 'get' | 'post' | 'patch' | 'delete'
  path: string
  body?: Record<string, unknown>
}

const FAKE_ID = '00000000-0000-0000-0000-000000000000'

const PROTECTED_ROUTES: RouteSpec[] = [
  // Categories
  { method: 'get', path: '/api/categories' },
  { method: 'post', path: '/api/categories', body: {} },
  { method: 'get', path: `/api/categories/${FAKE_ID}` },
  { method: 'patch', path: `/api/categories/${FAKE_ID}`, body: {} },
  { method: 'delete', path: `/api/categories/${FAKE_ID}` },
  // Entries
  { method: 'get', path: '/api/entries' },
  { method: 'post', path: '/api/entries', body: {} },
  { method: 'get', path: `/api/entries/${FAKE_ID}` },
  { method: 'patch', path: `/api/entries/${FAKE_ID}`, body: {} },
  { method: 'delete', path: `/api/entries/${FAKE_ID}` },
  { method: 'post', path: `/api/entries/${FAKE_ID}/reveal` },
  // 2FA
  { method: 'get', path: '/api/2fa' },
  { method: 'post', path: '/api/2fa', body: {} },
  { method: 'delete', path: `/api/2fa/${FAKE_ID}` },
  { method: 'post', path: `/api/2fa/${FAKE_ID}/reveal` },
  // Stats / Export / Account
  { method: 'get', path: '/api/stats' },
  { method: 'get', path: '/api/export' },
  { method: 'delete', path: '/api/account/data' },
  // AI
  { method: 'post', path: '/api/ai/extract', body: { prompt: 'test' } },
  // Upload
  { method: 'post', path: '/api/upload' },
  // Access keys (session-only — Bearer token also rejected)
  { method: 'get', path: '/api/access-keys' },
  { method: 'post', path: '/api/access-keys', body: {} },
  { method: 'delete', path: `/api/access-keys/${FAKE_ID}` }
]

test.describe('API auth guards — status 401', () => {
  for (const { method, path, body } of PROTECTED_ROUTES) {
    test(`${method.toUpperCase()} ${path}`, async ({ request }) => {
      const opts = body ? { data: body } : {}
      const res = await request[method](path, opts)
      expect(res.status()).toBe(401)
    })
  }
})

test.describe('API auth guards — response body', () => {
  test('401 response body contains { error: "Unauthorized" }', async ({
    request
  }) => {
    const res = await request.get('/api/categories')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: 'Unauthorized' })
  })

  test('401 response has JSON content-type', async ({ request }) => {
    const res = await request.get('/api/stats')
    expect(res.status()).toBe(401)
    expect(res.headers()['content-type']).toContain('application/json')
  })
})

test.describe('Access key Bearer auth', () => {
  test('Bearer with non-kagi_ prefix is rejected with 401', async ({
    request
  }) => {
    const res = await request.get('/api/categories', {
      headers: { Authorization: 'Bearer sk-thisisnotakagikeyatall' }
    })
    expect(res.status()).toBe(401)
  })

  test('Bearer kagi_ with invalid/non-existent key is rejected with 401', async ({
    request
  }) => {
    const res = await request.get('/api/categories', {
      headers: { Authorization: 'Bearer kagi_totallyfakekeyXXXXXXXXXXXXXXXXXXXX' }
    })
    expect(res.status()).toBe(401)
  })

  test('Bearer kagi_ key is rejected by access-key management endpoints (session only)', async ({
    request
  }) => {
    const res = await request.get('/api/access-keys', {
      headers: { Authorization: 'Bearer kagi_totallyfakekeyXXXXXXXXXXXXXXXXXXXX' }
    })
    // Even though it's a valid prefix, these routes require session auth
    expect(res.status()).toBe(401)
  })

  test('Bearer token without kagi_ prefix falls back to session check and returns 401', async ({
    request
  }) => {
    const res = await request.get('/api/entries', {
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.fake.jwt' }
    })
    expect(res.status()).toBe(401)
  })
})

test.describe('Public endpoints', () => {
  test('GET /api/openapi returns 200 without auth', async ({ request }) => {
    const res = await request.get('/api/openapi')
    expect(res.status()).toBe(200)
  })

  test('GET /api/openapi returns valid JSON', async ({ request }) => {
    const res = await request.get('/api/openapi')
    const body = await res.json()
    expect(body.openapi).toBe('3.1.0')
    expect(body.info.title).toBeDefined()
    expect(body.paths).toBeDefined()
  })

  test('GET /api/openapi has cache-control header', async ({ request }) => {
    const res = await request.get('/api/openapi')
    expect(res.headers()['cache-control']).toContain('max-age=3600')
  })
})
