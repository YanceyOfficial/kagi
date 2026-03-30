import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { genericOAuth } from 'better-auth/plugins'

// ── Provider availability flags (server-side only) ───────────────────────────

export const authProviders = {
  keycloak: !!(
    process.env.KEYCLOAK_URL &&
    process.env.KEYCLOAK_CLIENT_ID &&
    process.env.KEYCLOAK_REALM &&
    process.env.KEYCLOAK_CLIENT_SECRET
  ),
  emailPassword: process.env.ENABLE_EMAIL_PASSWORD === 'true'
} as const

export type AuthProviders = typeof authProviders

// ── Plugins (Keycloak via genericOAuth) ──────────────────────────────────────

const plugins = []

if (authProviders.keycloak) {
  plugins.push(
    genericOAuth({
      config: [
        {
          providerId: 'keycloak',
          clientId: process.env.KEYCLOAK_CLIENT_ID!,
          clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
          authorizationUrl: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth`,
          tokenUrl: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
          userInfoUrl: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
          scopes: ['openid', 'profile', 'email'],
          pkce: true
        }
      ]
    })
  )
}

// ── Auth config ───────────────────────────────────────────────────────────────

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),

  emailAndPassword: {
    enabled: authProviders.emailPassword,
    autoSignIn: true
  },

  plugins,

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24 // Refresh session if older than 1 day
  }
})

export type Auth = typeof auth
