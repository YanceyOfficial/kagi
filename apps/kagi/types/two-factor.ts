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
