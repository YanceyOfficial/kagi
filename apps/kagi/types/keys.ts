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

export type UpdateKeyEntryInput = Partial<Omit<CreateKeyEntryInput, 'categoryId'>>

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
