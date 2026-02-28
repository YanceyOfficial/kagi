import type { DashboardStats } from '@/types'
import { useQuery } from '@tanstack/react-query'

async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch('/api/stats')
  if (!res.ok) throw new Error('Failed to fetch stats')
  const json = await res.json()
  return json.data
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats
  })
}
