// Runs once on server startup (Next.js instrumentation hook)
// Seeds the initial admin user when email/password auth is enabled
export async function register() {
  if (process.env.ENABLE_EMAIL_PASSWORD !== 'true') return
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return

  const { db } = await import('@/lib/db')
  const { user } = await import('@/lib/db/schema')
  const { count } = await import('drizzle-orm')

  const [{ value }] = await db.select({ value: count() }).from(user)
  if (value > 0) return // Already have users, skip

  const { auth } = await import('@/lib/auth')
  await auth.api.signUpEmail({
    body: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      name: process.env.ADMIN_NAME ?? 'Admin'
    }
  })

  console.log(`[kagi] Admin user created: ${process.env.ADMIN_EMAIL}`)
}
