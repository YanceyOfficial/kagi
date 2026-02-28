export type { AccessKeyScope } from '@/lib/access-key'

export interface AccessKey {
  id: string
  name: string
  // Display prefix shown in UI, e.g. "kagi_ab12cd34" — never the full key
  keyPrefix: string
  scopes: string[]
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export interface CreateAccessKeyInput {
  name: string
  scopes: string[]
  expiresAt?: string
}

// Returned only on creation — the plaintext key is shown once and never stored
export interface CreateAccessKeyResponse extends AccessKey {
  key: string
}
