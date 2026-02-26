'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import type { KeyCategory } from '@/types'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { CategoryIcon } from './category-icon'
import { KeyTypeBadge } from './key-type-badge'

interface CategoryCardProps {
  category: KeyCategory
  onEdit: (category: KeyCategory) => void
  onDelete: (category: KeyCategory) => void
}

export function CategoryCard({
  category,
  onEdit,
  onDelete
}: CategoryCardProps) {
  return (
    <Card className="group border-border bg-card/60 hover:border-primary/40 hover:bg-card/80 backdrop-blur transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/keys/${category.id}`}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <CategoryIcon category={category} size="md" />
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate font-mono text-sm font-semibold">
                {category.name}
              </CardTitle>
              {category.description && (
                <CardDescription className="mt-0.5 line-clamp-1 font-mono text-xs">
                  {category.description}
                </CardDescription>
              )}
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => e.preventDefault()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="font-mono">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Pencil className="mr-2 size-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(category)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <KeyTypeBadge type={category.keyType} />
          {category.entryCount !== undefined && (
            <Badge variant="secondary" className="h-5 font-mono text-xs">
              {category.entryCount}{' '}
              {category.entryCount === 1 ? 'entry' : 'entries'}
            </Badge>
          )}
          {category.envVarName && (
            <Badge
              variant="outline"
              className="border-muted text-muted-foreground h-5 font-mono text-xs"
            >
              {category.envVarName}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
