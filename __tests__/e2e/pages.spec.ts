/**
 * Dashboard page structure tests (requires running app + Keycloak auth).
 *
 * These tests use client-side session mocking to check UI rendering.
 * Server-side RSC auth guards may still redirect to /login — those tests
 * are skipped automatically when that happens.
 *
 * To run fully: start the dev server against a test Keycloak instance.
 */
import { expect, test } from '@playwright/test'

const MOCK_SESSION = {
  session: { id: 'sess-1', userId: 'user-1', expiresAt: '2099-01-01T00:00:00Z' },
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
    createdAt: '2024-01-01T00:00:00Z'
  }
}

const MOCK_STATS = {
  data: { categories: 3, entries: 12, twoFaSets: 2 }
}

function setupAuthMocks(page: import('@playwright/test').Page) {
  return Promise.all([
    page.route('**/api/auth/get-session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SESSION)
      })
    ),
    page.route('**/api/stats', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_STATS)
      })
    ),
    page.route('**/api/categories**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] })
      })
    ),
    page.route('**/api/entries**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] })
      })
    ),
    page.route('**/api/2fa**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] })
      })
    )
  ])
}

// ── Keys page ─────────────────────────────────────────────────────────────────

test.describe('Keys page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page)
    await page.goto('/keys')
    test.skip(
      new URL(page.url()).pathname === '/login',
      'Server-side auth redirect — skipped (requires running Keycloak)'
    )
  })

  test('renders Key Categories heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /key categories/i })).toBeVisible()
  })

  test('"New Category" button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /new category/i })
    ).toBeVisible()
  })

  test('search input is present', async ({ page }) => {
    await expect(page.getByPlaceholder('Search categories...')).toBeVisible()
  })
})

// ── 2FA page ──────────────────────────────────────────────────────────────────

test.describe('2FA Recovery page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page)
    await page.goto('/2fa')
    test.skip(
      new URL(page.url()).pathname === '/login',
      'Server-side auth redirect — skipped (requires running Keycloak)'
    )
  })

  test('renders 2FA Recovery Tokens heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /2fa recovery tokens/i })
    ).toBeVisible()
  })

  test('"Add Tokens" button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /add tokens/i })
    ).toBeVisible()
  })

  test('search input is present', async ({ page }) => {
    await expect(page.getByPlaceholder('Search services...')).toBeVisible()
  })

  test('shows empty state when no tokens', async ({ page }) => {
    await expect(page.getByText('No 2FA tokens stored yet')).toBeVisible()
  })
})

// ── AI Extract page ───────────────────────────────────────────────────────────

test.describe('AI Extract page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page)
    await page.goto('/ai-extract')
    test.skip(
      new URL(page.url()).pathname === '/login',
      'Server-side auth redirect — skipped (requires running Keycloak)'
    )
  })

  test('renders AI Key Extractor heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /ai key extractor/i })
    ).toBeVisible()
  })

  test('privacy note is visible', async ({ page }) => {
    await expect(page.getByText(/privacy-first/i)).toBeVisible()
  })

  test('prompt textarea is present', async ({ page }) => {
    await expect(page.getByRole('textbox')).toBeVisible()
  })

  test('"Extract Keys" button starts disabled when prompt is empty', async ({
    page
  }) => {
    const btn = page.getByRole('button', { name: /extract keys/i })
    await expect(btn).toBeDisabled()
  })

  test('"Extract Keys" button enables when prompt is typed', async ({
    page
  }) => {
    await page.getByRole('textbox').fill('Get my OpenAI key')
    const btn = page.getByRole('button', { name: /extract keys/i })
    await expect(btn).toBeEnabled()
  })

  test('example prompt buttons populate the textarea', async ({ page }) => {
    const exampleBtn = page
      .getByRole('button', { name: /extract the openai key/i })
      .first()
    await exampleBtn.click()
    const textarea = page.getByRole('textbox')
    const value = await textarea.inputValue()
    expect(value.length).toBeGreaterThan(10)
  })
})

// ── Settings page ─────────────────────────────────────────────────────────────

test.describe('Settings page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page)
    await page.goto('/settings')
    test.skip(
      new URL(page.url()).pathname === '/login',
      'Server-side auth redirect — skipped (requires running Keycloak)'
    )
  })

  test('renders Profile section', async ({ page }) => {
    await expect(page.getByText('Profile')).toBeVisible()
  })

  test('renders Security section with AES-256-GCM', async ({ page }) => {
    await expect(page.getByText('AES-256-GCM')).toBeVisible()
  })

  test('renders Vault section', async ({ page }) => {
    await expect(page.getByText('Vault')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /export vault metadata/i })
    ).toBeVisible()
  })

  test('renders Danger Zone section', async ({ page }) => {
    await expect(page.getByText('Danger Zone')).toBeVisible()
  })

  test('Delete All button is disabled until DELETE is typed', async ({
    page
  }) => {
    // Only present when stats > 0; skip if vault is empty
    const deleteBtn = page.getByRole('button', { name: /delete all/i })
    if (!(await deleteBtn.isVisible())) {
      test.skip(true, 'Vault is empty — Danger Zone input not shown')
      return
    }
    await expect(deleteBtn).toBeDisabled()
    await page.getByPlaceholder('DELETE').fill('DELETE')
    await expect(deleteBtn).toBeEnabled()
  })
})

// ── Sidebar navigation ────────────────────────────────────────────────────────

test.describe('App sidebar navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page)
    await page.goto('/keys')
    test.skip(
      new URL(page.url()).pathname === '/login',
      'Server-side auth redirect — skipped (requires running Keycloak)'
    )
  })

  test('sidebar contains Overview link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /overview/i })).toBeVisible()
  })

  test('sidebar contains Keys link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /^keys$/i })).toBeVisible()
  })

  test('sidebar contains 2FA Recovery link', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /2fa recovery/i })
    ).toBeVisible()
  })

  test('sidebar contains AI Extract link', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /ai extract/i })
    ).toBeVisible()
  })

  test('sidebar contains Settings link', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /settings/i })
    ).toBeVisible()
  })

  test('Kagi branding is in the sidebar header', async ({ page }) => {
    await expect(page.getByText('Kagi').first()).toBeVisible()
  })
})
