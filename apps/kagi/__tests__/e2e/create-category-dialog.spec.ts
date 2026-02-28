/**
 * CreateCategoryDialog interaction tests.
 *
 * The Keys page itself requires auth (server-side redirect). To test the
 * dialog we intercept the better-auth session endpoint and the categories
 * API so the client side renders as if a user is logged in.
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

// Install mocks before every test in this file
test.beforeEach(async ({ page }) => {
  // Mock better-auth session check (used by both RSC and client)
  await page.route('**/api/auth/get-session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SESSION)
    })
  })

  // Mock categories list (empty vault)
  await page.route('**/api/categories**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] })
      })
    } else {
      await route.continue()
    }
  })
})

test.describe('New Category dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/keys')
    // If SSR redirected us (no mock at server level), skip
    test.skip(
      new URL(page.url()).pathname === '/login',
      'Server-side auth redirect — skipped (requires running Keycloak)'
    )
  })

  test('clicking "New Category" opens the dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new category/i }).click()
    await expect(
      page.getByRole('dialog', { name: /new key category/i })
    ).toBeVisible()
  })

  test('dialog shows all required fields', async ({ page }) => {
    await page.getByRole('button', { name: /new category/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Service Name')).toBeVisible()
    await expect(dialog.getByText('Key Type')).toBeVisible()
    await expect(dialog.getByText('Brand Icon')).toBeVisible()
    await expect(dialog.getByText('Service Website')).toBeVisible()
  })

  test('Cancel button closes the dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new category/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: /cancel/i }).click()
    await expect(dialog).not.toBeVisible()
  })

  test('Create Category button is the submit action', async ({ page }) => {
    await page.getByRole('button', { name: /new category/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByRole('button', { name: /create category/i })
    ).toBeVisible()
  })

  test('Key Type select defaults to simple', async ({ page }) => {
    await page.getByRole('button', { name: /new category/i }).click()
    const dialog = page.getByRole('dialog')
    // simple type shows Env Variable Name field
    await expect(dialog.getByText('Env Variable Name')).toBeVisible()
  })

  test('changing Key Type to group shows Field Definitions', async ({
    page
  }) => {
    await page.getByRole('button', { name: /new category/i }).click()
    const dialog = page.getByRole('dialog')

    const select = dialog.locator('[role="combobox"]').first()
    await select.click()
    await page.getByRole('option', { name: /^group/i }).click()

    await expect(dialog.getByText('Field Definitions')).toBeVisible()
    await expect(dialog.getByText('Env Variable Name')).not.toBeVisible()
  })

  test('changing Key Type to ssh hides both Env Var and Field Definitions', async ({
    page
  }) => {
    await page.getByRole('button', { name: /new category/i }).click()
    const dialog = page.getByRole('dialog')

    const select = dialog.locator('[role="combobox"]').first()
    await select.click()
    await page.getByRole('option', { name: /^ssh/i }).click()

    await expect(dialog.getByText('Env Variable Name')).not.toBeVisible()
    await expect(dialog.getByText('Field Definitions')).not.toBeVisible()
  })

  test('reopening dialog resets form state', async ({ page }) => {
    // Open, type a name, close
    await page.getByRole('button', { name: /new category/i }).click()
    const dialog = page.getByRole('dialog')
    await dialog
      .getByPlaceholder(/openai.*aws.*github/i)
      .fill('Leftover Category')
    await dialog.getByRole('button', { name: /cancel/i }).click()

    // Reopen — field should be empty
    await page.getByRole('button', { name: /new category/i }).click()
    const nameInput = page.getByPlaceholder(/openai.*aws.*github/i)
    await expect(nameInput).toHaveValue('')
  })
})

test.describe('Keys page empty state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/keys')
    test.skip(
      new URL(page.url()).pathname === '/login',
      'Server-side auth redirect — skipped (requires running Keycloak)'
    )
  })

  test('shows empty state when no categories', async ({ page }) => {
    await expect(page.getByText('No key categories yet')).toBeVisible()
  })

  test('empty state has a Create Category CTA', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /create category/i })
    ).toBeVisible()
  })

  test('search bar is visible', async ({ page }) => {
    await expect(
      page.getByPlaceholder('Search categories...')
    ).toBeVisible()
  })
})
