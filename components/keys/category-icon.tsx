import { cn } from '@/lib/utils'
import type { KeyCategory } from '@/types'

interface CategoryIconProps {
  category: Pick<KeyCategory, 'iconEmoji' | 'iconUrl' | 'color' | 'name'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'size-7 text-sm',
  md: 'size-10 text-base',
  lg: 'size-14 text-2xl'
}

export function CategoryIcon({
  category,
  size = 'md',
  className
}: CategoryIconProps) {
  const initials = category.name.slice(0, 2).toUpperCase()

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg font-mono font-bold',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: category.color
          ? `${category.color}22`
          : 'oklch(0.65 0.2 150 / 0.15)',
        border: `1px solid ${category.color ?? 'oklch(0.65 0.2 150 / 0.3)'}`
      }}
    >
      {category.iconEmoji ? (
        <span>{category.iconEmoji}</span>
      ) : category.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={category.iconUrl}
          alt={category.name}
          className="size-full rounded object-contain p-0.5"
        />
      ) : (
        <span
          className="text-xs font-bold"
          style={{ color: category.color ?? 'oklch(0.65 0.2 150)' }}
        >
          {initials}
        </span>
      )}
    </div>
  )
}
