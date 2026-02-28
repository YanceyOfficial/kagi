import { expect, test } from '@playwright/test'

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('renders the KAGI ASCII art header', async ({ page }) => {
    const pre = page.locator('pre')
    await expect(pre).toBeVisible()
    const text = await pre.textContent()
    expect(text).toContain('KAGI')
  })

  test('renders the subtitle with Japanese kanji', async ({ page }) => {
    await expect(page.getByText('鍵')).toBeVisible()
    await expect(page.getByText('Secret Key Manager')).toBeVisible()
  })

  test('renders "Access Vault" card title', async ({ page }) => {
    await expect(page.getByText('Access Vault')).toBeVisible()
  })

  test('renders sign-in description', async ({ page }) => {
    await expect(
      page.getByText('Sign in with your organisation account')
    ).toBeVisible()
  })

  test('renders the Sign in with Keycloak button (enabled by default)', async ({
    page
  }) => {
    const btn = page.getByRole('button', { name: /sign in with keycloak/i })
    await expect(btn).toBeVisible()
    await expect(btn).toBeEnabled()
  })

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/sign in/i)
  })

  test('button enters loading state on click', async ({ page }) => {
    // Intercept the auth API call so it hangs — lets us observe loading state
    await page.route('**/api/auth/**', async (route) => {
      // Delay to keep spinner visible long enough to assert
      await new Promise((r) => setTimeout(r, 3000))
      await route.continue()
    })

    const btn = page.getByRole('button', { name: /sign in with keycloak/i })
    await btn.click()

    // Button text changes to "Redirecting..." and becomes disabled
    await expect(page.getByRole('button', { name: /redirecting/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /redirecting/i })).toBeDisabled()
  })

  test('SSO note is visible below the button', async ({ page }) => {
    await expect(
      page.getByText(/authentication is handled by your organisation/i)
    ).toBeVisible()
  })
})

test.describe('Unauthenticated redirects', () => {
  const PROTECTED_PAGES = ['/', '/keys', '/settings', '/ai-extract', '/2fa']

  for (const path of PROTECTED_PAGES) {
    test(`${path} redirects to /login`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
    })
  }

  test('redirected page still renders login UI', async ({ page }) => {
    await page.goto('/keys')
    // After redirect, login page should be fully rendered
    await expect(page.getByText('Access Vault')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /sign in with keycloak/i })
    ).toBeVisible()
  })
})
