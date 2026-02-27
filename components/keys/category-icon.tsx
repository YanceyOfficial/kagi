import { cn } from '@/lib/utils'
import type { KeyCategory } from '@/types'
import type { SimpleIcon } from 'simple-icons'
import * as si from 'simple-icons'

interface CategoryIconProps {
  category: Pick<KeyCategory, 'iconSlug' | 'iconUrl' | 'color' | 'name'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'size-7',
  md: 'size-10',
  lg: 'size-14'
}

const svgSizeClasses = {
  sm: 'size-3.5',
  md: 'size-5',
  lg: 'size-7'
}

function getIcon(slug: string): SimpleIcon | undefined {
  // simple-icons export names: "si" + PascalCase slug, e.g. "openai" → "siOpenai"
  const varName = 'si' + slug.charAt(0).toUpperCase() + slug.slice(1)
  return (si as unknown as Record<string, SimpleIcon | undefined>)[varName]
}

// Returns true if a 6-char hex color is too dark to be visible on a dark background
function isHexDark(hex: string): boolean {
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b < 80
}

export function CategoryIcon({
  category,
  size = 'md',
  className
}: CategoryIconProps) {
  const initials = category.name.slice(0, 2).toUpperCase()
  const icon = category.iconSlug ? getIcon(category.iconSlug) : undefined
  const brandColor = icon ? `#${icon.hex}` : null
  const displayColor = category.color ?? brandColor ?? '#ffffff'

  // On dark backgrounds, very dark icons become invisible — use white fill instead
  const rawHex = (category.color ?? brandColor)?.slice(1)
  const iconFill = rawHex && isHexDark(rawHex) ? '#ffffff' : displayColor

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${displayColor}22`,
        border: `1px solid ${displayColor}66`
      }}
    >
      {icon ? (
        <svg
          role="img"
          viewBox="0 0 24 24"
          className={svgSizeClasses[size]}
          style={{ fill: iconFill }}
          aria-label={icon.title}
        >
          <path d={icon.path} />
        </svg>
      ) : category.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={category.iconUrl}
          alt={category.name}
          className="size-full rounded-lg object-cover"
        />
      ) : (
        <span
          className="font-mono text-xs font-bold"
          style={{ color: displayColor }}
        >
          {initials}
        </span>
      )}
    </div>
  )
}
