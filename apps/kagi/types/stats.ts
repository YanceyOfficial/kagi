import type { Environment, KeyEntryWithCategory, KeyType } from './keys'

export interface DashboardStats {
  totalCategories: number
  totalEntries: number
  totalTwoFactorSets: number
  keyTypeBreakdown: { type: KeyType; count: number }[]
  environmentBreakdown: { environment: Environment; count: number }[]
  recentEntries: KeyEntryWithCategory[]
  expiringEntries: KeyEntryWithCategory[]
}
