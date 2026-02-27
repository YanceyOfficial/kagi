'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { SimpleIcon } from 'simple-icons'
import * as si from 'simple-icons'

// simple-icons exports are named "si" + PascalCase, e.g. siOpenai, siGithub
// Each export is a SimpleIcon object with { title, slug, hex, path }
const ALL_ICONS: SimpleIcon[] = Object.entries(si)
  .filter(([key]) => key.startsWith('si') && key.length > 2)
  .map(([, icon]) => icon as SimpleIcon)
  .sort((a, b) => a.title.localeCompare(b.title))

function getIcon(slug: string): SimpleIcon | undefined {
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

function iconFill(hex: string): string {
  return isHexDark(hex) ? '#ffffff' : `#${hex}`
}

interface IconTypePickerProps {
  value: string
  onChange: (slug: string) => void
  className?: string
}

export function IconTypePicker({
  value,
  onChange,
  className
}: IconTypePickerProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedIcon = useMemo(() => {
    if (!value) return undefined
    return getIcon(value)
  }, [value])

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_ICONS.slice(0, 48)
    const q = query.toLowerCase()
    return ALL_ICONS.filter((icon) =>
      icon.title.toLowerCase().includes(q)
    ).slice(0, 48)
  }, [query])

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  function select(slug: string) {
    onChange(slug)
    setOpen(false)
    setQuery('')
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
        className={cn(
          'border-input bg-background flex h-9 w-full items-center gap-2 rounded-md border px-3 font-mono text-sm',
          'hover:bg-accent/50 transition-colors',
          open && 'ring-ring ring-2 ring-offset-0'
        )}
      >
        {selectedIcon ? (
          <>
            <svg
              role="img"
              viewBox="0 0 24 24"
              className="size-3.5 shrink-0"
              style={{ fill: iconFill(selectedIcon.hex) }}
              aria-label={selectedIcon.title}
            >
              <path d={selectedIcon.path} />
            </svg>
            <span className="flex-1 text-left text-sm">
              {selectedIcon.title}
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={clear}
              onKeyDown={(e) =>
                e.key === 'Enter' && clear(e as unknown as React.MouseEvent)
              }
              className="text-muted-foreground hover:text-foreground ml-auto"
            >
              <X className="size-3" />
            </span>
          </>
        ) : (
          <span className="text-muted-foreground flex-1 text-left text-sm">
            Search icon... (optional)
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="bg-popover border-border absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border shadow-lg">
          <div className="border-border border-b p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brand icons..."
              className="bg-background text-foreground placeholder:text-muted-foreground w-full rounded border-0 px-2 py-1 font-mono text-xs outline-none"
            />
          </div>
          <TooltipProvider delayDuration={300}>
            <div className="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto p-1.5">
              {filtered.map((icon) => (
                <Tooltip key={icon.slug}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => select(icon.slug)}
                      className={cn(
                        'flex items-center justify-center rounded p-1.5 transition-colors',
                        'hover:bg-accent',
                        value === icon.slug && 'bg-accent ring-ring ring-1'
                      )}
                    >
                      <svg
                        role="img"
                        viewBox="0 0 24 24"
                        className="size-4"
                        style={{ fill: iconFill(icon.hex) }}
                        aria-label={icon.title}
                      >
                        <path d={icon.path} />
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{icon.title}</TooltipContent>
                </Tooltip>
              ))}
              {filtered.length === 0 && (
                <p className="text-muted-foreground col-span-8 py-4 text-center font-mono text-xs">
                  No icons found
                </p>
              )}
            </div>
          </TooltipProvider>
          {!query && (
            <p className="text-muted-foreground border-border border-t px-3 py-1.5 font-mono text-[10px]">
              Showing popular icons — type to search all{' '}
              {ALL_ICONS.length.toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
