import { CategoryIcon } from '@/components/keys/category-icon'
import { KeyTypeBadge } from '@/components/keys/key-type-badge'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardStats } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface RecentEntriesProps {
  stats?: DashboardStats
  loading?: boolean
}

export function RecentEntries({ stats, loading }: RecentEntriesProps) {
  const entries = stats?.recentEntries ?? []
  const expiring = stats?.expiringEntries ?? []

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Recently added */}
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="font-mono text-sm">Recently Added</CardTitle>
          <CardDescription className="font-mono text-xs">
            Last 5 key entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center font-mono text-xs">
              No entries yet
            </p>
          ) : (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/keys/${entry.categoryId}`}
                    className="hover:bg-accent flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors"
                  >
                    <CategoryIcon category={entry.category} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs font-medium">
                        {entry.category.name}
                      </p>
                      <p className="text-muted-foreground truncate font-mono text-xs">
                        {entry.projectName}
                      </p>
                    </div>
                    <KeyTypeBadge type={entry.category.keyType} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Expiring soon */}
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="font-mono text-sm">Expiring Soon</CardTitle>
          <CardDescription className="font-mono text-xs">
            Keys expiring within 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : expiring.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center font-mono text-xs">
              No expiring keys — you&apos;re safe
            </p>
          ) : (
            <ul className="space-y-2">
              {expiring.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/keys/${entry.categoryId}`}
                    className="hover:bg-accent flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors"
                  >
                    <CategoryIcon category={entry.category} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs font-medium">
                        {entry.category.name}
                      </p>
                      <p className="text-muted-foreground truncate font-mono text-xs">
                        {entry.projectName}
                      </p>
                    </div>
                    {entry.expiresAt && (
                      <Badge
                        variant="destructive"
                        className="shrink-0 font-mono text-xs"
                      >
                        {formatDistanceToNow(new Date(entry.expiresAt), {
                          addSuffix: true
                        })}
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
