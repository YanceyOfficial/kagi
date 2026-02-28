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
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const KEY_TYPE_COLORS: Record<string, string> = {
  simple: 'oklch(0.65 0.2 150)',
  group: 'oklch(0.55 0.18 165)',
  ssh: 'oklch(0.75 0.16 130)',
  json: 'oklch(0.5 0.15 170)'
}

const KEY_TYPE_LABELS: Record<string, string> = {
  simple: 'Simple String',
  group: 'Key Group',
  ssh: 'SSH Key',
  json: 'JSON File'
}

interface KeyTypeChartProps {
  stats?: DashboardStats
  loading?: boolean
}

export function KeyTypeChart({ stats, loading }: KeyTypeChartProps) {
  const data =
    stats?.keyTypeBreakdown.map((item) => ({
      name: KEY_TYPE_LABELS[item.type] ?? item.type,
      value: item.count,
      color: KEY_TYPE_COLORS[item.type] ?? 'oklch(0.65 0.2 150)'
    })) ?? []

  return (
    <Card className="border-border bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="font-mono text-sm">Key Types</CardTitle>
        <CardDescription className="font-mono text-xs">
          Distribution of stored key formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full rounded" />
        ) : data.length === 0 ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center font-mono text-xs">
            No keys yet — add your first category
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={192}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'oklch(0.13 0.01 150)',
                  border: '1px solid oklch(0.25 0.02 150)',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: '12px',
                  color: 'oklch(0.9 0.04 150)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        {!loading && data.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-muted-foreground truncate font-mono text-xs">
                  {item.name}
                </span>
                <span className="text-foreground ml-auto font-mono text-xs font-bold">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
