'use client'

import { useStats } from '@/lib/hooks/use-stats'
import { EnvironmentChart } from './environment-chart'
import { KeyTypeChart } from './key-type-chart'
import { RecentEntries } from './recent-entries'
import { StatsCards } from './stats-cards'

export function DashboardClient() {
  const { data: stats, isLoading } = useStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground font-mono text-2xl font-bold">
          Overview
        </h1>
        <p className="text-muted-foreground mt-1 font-mono text-sm">
          Your key vault at a glance
        </p>
      </div>

      <StatsCards stats={stats} loading={isLoading} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <KeyTypeChart stats={stats} loading={isLoading} />
        <EnvironmentChart stats={stats} loading={isLoading} />
      </div>

      <RecentEntries stats={stats} loading={isLoading} />
    </div>
  )
}
