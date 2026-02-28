import type { Environment, KeyType } from './keys'

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
