import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardStats } from '@/types'
import { KeyRound, ShieldCheck, Tag } from 'lucide-react'

interface StatsCardsProps {
  stats?: DashboardStats
  loading?: boolean
}

const cards = [
  {
    title: 'Categories',
    icon: Tag,
    key: 'totalCategories' as const,
    description: 'Key service types registered'
  },
  {
    title: 'Key Entries',
    icon: KeyRound,
    key: 'totalEntries' as const,
    description: 'Encrypted keys stored'
  },
  {
    title: '2FA Token Sets',
    icon: ShieldCheck,
    key: 'totalTwoFactorSets' as const,
    description: 'Recovery token collections'
  }
]

export function StatsCards({ stats, loading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.key} className="border-border bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
              {card.title}
            </CardTitle>
            <card.icon className="text-primary size-4" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-foreground font-mono text-3xl font-bold">
                {stats?.[card.key] ?? 0}
              </div>
            )}
            <p className="text-muted-foreground mt-1 font-mono text-xs">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
