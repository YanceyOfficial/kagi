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
import type { EnvProject } from '@/types'
import { FileText, FolderDot, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface EnvProjectCardProps {
  project: EnvProject
  onEdit: (project: EnvProject) => void
  onDelete: (project: EnvProject) => void
}

export function EnvProjectCard({
  project,
  onEdit,
  onDelete
}: EnvProjectCardProps) {
  return (
    <Card className="group border-border bg-card/60 hover:border-primary/40 hover:bg-card/80 backdrop-blur transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/envs/${project.id}`}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
              <FolderDot className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate font-mono text-sm font-semibold">
                {project.name}
              </CardTitle>
              {project.description && (
                <CardDescription className="mt-0.5 line-clamp-1 font-mono text-xs">
                  {project.description}
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
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Pencil className="mr-2 size-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(project)}
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
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="h-5 font-mono text-xs">
            <FileText className="mr-1 size-2.5" />
            {project.fileCount} {project.fileCount === 1 ? 'file' : 'files'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
