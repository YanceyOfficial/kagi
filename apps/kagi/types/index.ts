// Core domain types for Kagi key management system

export type KeyType = 'simple' | 'group' | 'ssh' | 'json'
export type Environment = 'production' | 'staging' | 'development' | 'local'

// ─── Key Category (First Level) ───────────────────────────────────────────────

export interface KeyCategory {
  id: string
  userId: string
  name: string
  description: string | null
  iconUrl: string | null
  iconSlug: string | null
  color: string | null
  keyType: KeyType
  // For 'simple' type: the env var name, e.g. "OPENAI_API_KEY"
  envVarName: string | null
  // For 'group' type: ordered list of field names, e.g. ["AWS_REGION", "AWS_ACCESS_KEY_ID"]
  fieldDefinitions: string[] | null
  createdAt: string
  updatedAt: string
  // Computed
  entryCount?: number
}

export interface CreateKeyCategoryInput {
  name: string
  description?: string
  iconUrl?: string
  iconSlug?: string
  color?: string
  keyType: KeyType
  envVarName?: string
  fieldDefinitions?: string[]
}

export type UpdateKeyCategoryInput = Partial<CreateKeyCategoryInput>

// ─── Key Entry (Second Level) ─────────────────────────────────────────────────

export interface KeyEntry {
  id: string
  categoryId: string
  projectName: string
  description: string | null
  environment: Environment
  // encryptedValue is never sent to the client — only revealed on explicit request
  fileName: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  expiresAt: string | null
}

export interface KeyEntryWithCategory extends KeyEntry {
  category: Pick<
    KeyCategory,
    | 'id'
    | 'name'
    | 'keyType'
    | 'envVarName'
    | 'fieldDefinitions'
    | 'iconSlug'
    | 'iconUrl'
    | 'color'
  >
}

export interface CreateKeyEntryInput {
  categoryId: string
  projectName: string
  description?: string
  environment?: Environment
  // The plaintext value (will be encrypted server-side)
  value: string | Record<string, string>
  fileName?: string
  notes?: string
  expiresAt?: string
}

export type UpdateKeyEntryInput = Partial<
  Omit<CreateKeyEntryInput, 'categoryId'>
>

// The revealed plaintext value from /api/entries/:id/reveal
export interface RevealedKeyValue {
  id: string
  keyType: KeyType
  // For 'simple': a plain string
  // For 'group': a key-value map
  // For 'ssh' / 'json': file content as string
  value: string | Record<string, string>
  envVarName: string | null
  fieldDefinitions: string[] | null
  fileName: string | null
}

// ─── 2FA Recovery Tokens ──────────────────────────────────────────────────────

export interface TwoFactorToken {
  id: string
  userId: string
  service: string
  label: string | null
  // tokens array is never sent to client until revealed
  totalCount: number
  usedCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateTwoFactorTokenInput {
  service: string
  label?: string
  // Plaintext array of recovery tokens
  tokens: string[]
}

export interface RevealedTwoFactorTokens {
  id: string
  service: string
  tokens: string[]
}

// ─── Dashboard Statistics ─────────────────────────────────────────────────────

export interface DashboardStats {
  totalCategories: number
  totalEntries: number
  totalTwoFactorSets: number
  keyTypeBreakdown: { type: KeyType; count: number }[]
  environmentBreakdown: { environment: Environment; count: number }[]
  recentEntries: KeyEntryWithCategory[]
  expiringEntries: KeyEntryWithCategory[]
}

// ─── AI Extraction ────────────────────────────────────────────────────────────

export interface AiKeyRef {
  categoryId: string
  categoryName: string
  keyType: KeyType
  // For 'simple': env var name
  envVarName: string | null
  // For 'group': field definitions
  fieldDefinitions: string[] | null
  entries: {
    entryId: string
    projectName: string
    environment: Environment
  }[]
}

export interface AiExtractRequest {
  prompt: string
}

// What the AI returns (no actual values — just key references + optional renamed env vars)
export interface AiSelectedKey {
  entryId: string
  // The AI may suggest a transformed env var name (e.g. NEXT_PUBLIC_GA_KEY)
  envVarName: string
  reason: string
}

export interface AiExtractResponse {
  selectedKeys: AiSelectedKey[]
  // Generated .env file content (with real decrypted values)
  envContent: string
}

// ─── Access Keys ──────────────────────────────────────────────────────────────

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

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T
}

export interface ApiError {
  error: string
  details?: unknown
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
