'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardStats } from '@/types'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

const ENV_COLORS: Record<string, string> = {
  production: 'oklch(0.65 0.2 150)',
  staging: 'oklch(0.7 0.15 80)',
  development: 'oklch(0.6 0.15 220)',
  local: 'oklch(0.55 0.1 0)'
}

interface EnvironmentChartProps {
  stats?: DashboardStats
  loading?: boolean
}

export function EnvironmentChart({ stats, loading }: EnvironmentChartProps) {
  const data =
    stats?.environmentBreakdown.map((item) => ({
      name: item.environment,
      count: item.count,
      color: ENV_COLORS[item.environment] ?? 'oklch(0.65 0.2 150)'
    })) ?? []

  return (
    <Card className="border-border bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="font-mono text-sm">Environments</CardTitle>
        <CardDescription className="font-mono text-xs">
          Keys per deployment environment
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full rounded" />
        ) : data.length === 0 ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center font-mono text-xs">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={192}>
            <BarChart data={data} margin={{ left: -20 }}>
              <XAxis
                dataKey="name"
                tick={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: 10,
                  fill: 'oklch(0.55 0.07 150)'
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: 10,
                  fill: 'oklch(0.55 0.07 150)'
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'oklch(0.13 0.01 150)',
                  border: '1px solid oklch(0.25 0.02 150)',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: '12px',
                  color: 'oklch(0.9 0.04 150)'
                }}
                cursor={{ fill: 'oklch(0.2 0.02 150)' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
