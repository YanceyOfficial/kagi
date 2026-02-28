import { createHash, randomBytes } from 'node:crypto'

export const ACCESS_KEY_PREFIX = 'kagi_'

export const ALL_SCOPES = [
  'categories:read',
  'categories:write',
  'entries:read',
  'entries:write',
  'entries:reveal',
  '2fa:read',
  '2fa:write',
  '2fa:reveal',
  'stats:read',
  'export:read',
  'ai:extract'
] as const

export type AccessKeyScope = (typeof ALL_SCOPES)[number]

export const SCOPE_DESCRIPTIONS: Record<AccessKeyScope, string> = {
  'categories:read': 'List and view key categories',
  'categories:write': 'Create, update, and delete key categories',
  'entries:read': 'List and view key entries (without secret values)',
  'entries:write': 'Create, update, and delete key entries',
  'entries:reveal': 'Decrypt and retrieve plaintext secret values',
  '2fa:read': 'List and view 2FA token sets',
  '2fa:write': 'Create, update, and delete 2FA token sets',
  '2fa:reveal': 'Decrypt and retrieve plaintext recovery tokens',
  'stats:read': 'View dashboard statistics',
  'export:read': 'Export vault metadata as JSON',
  'ai:extract': 'Use AI to generate .env files from stored keys'
}

/**
 * Generate a new access key.
 * Returns the plaintext key (shown once), its SHA-256 hash (stored in DB),
 * and the display prefix shown in the UI.
 */
export function generateAccessKey(): {
  key: string
  hash: string
  keyPrefix: string
} {
  const random = randomBytes(32).toString('base64url')
  const key = `${ACCESS_KEY_PREFIX}${random}`
  const hash = hashAccessKey(key)
  const keyPrefix = `${ACCESS_KEY_PREFIX}${random.slice(0, 8)}`
  return { key, hash, keyPrefix }
}

/** SHA-256 hash of an access key string. */
export function hashAccessKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}
