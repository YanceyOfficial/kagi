import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { KeyType } from '@/types'
import { Braces, FileJson, KeyRound, Terminal } from 'lucide-react'

interface KeyTypeBadgeProps {
  type: KeyType
  showIcon?: boolean
  className?: string
}

const TYPE_CONFIG: Record<
  KeyType,
  { label: string; icon: React.ElementType; className: string }
> = {
  simple: {
    label: 'String',
    icon: KeyRound,
    className: 'border-emerald-700/50 bg-emerald-950/30 text-emerald-400'
  },
  group: {
    label: 'Group',
    icon: Braces,
    className: 'border-blue-700/50 bg-blue-950/30 text-blue-400'
  },
  ssh: {
    label: 'SSH Key',
    icon: Terminal,
    className: 'border-purple-700/50 bg-purple-950/30 text-purple-400'
  },
  json: {
    label: 'JSON',
    icon: FileJson,
    className: 'border-amber-700/50 bg-amber-950/30 text-amber-400'
  }
}

export function KeyTypeBadge({
  type,
  showIcon = true,
  className
}: KeyTypeBadgeProps) {
  const config = TYPE_CONFIG[type]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn('h-5 gap-1 font-mono text-xs', config.className, className)}
    >
      {showIcon && <Icon className="size-3" />}
      {config.label}
    </Badge>
  )
}
