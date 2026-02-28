'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  useCreateEnvProject,
  useEnvProjects,
  useSaveEnvFile
} from '@/lib/hooks/use-envs'
import { ENV_FILE_TYPES, type EnvFileType } from '@/types'
import { Loader2, Save } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const FILE_TYPE_LABELS: Record<EnvFileType, string> = {
  env: '.env',
  'env.local': '.env.local',
  'env.production': '.env.production',
  'env.development': '.env.development'
}

interface SaveToEnvProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: string
}

export function SaveToEnvProjectDialog({
  open,
  onOpenChange,
  content
}: SaveToEnvProjectDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedFileType, setSelectedFileType] = useState<EnvFileType>('env')
  const [newProjectName, setNewProjectName] = useState('')

  const { data: projects = [] } = useEnvProjects()
  const createProjectMutation = useCreateEnvProject()
  const saveFileMutation = useSaveEnvFile()

  const isPending =
    createProjectMutation.isPending || saveFileMutation.isPending

  async function handleSave() {
    let projectId = selectedProjectId

    if (newProjectName.trim()) {
      const project = await createProjectMutation.mutateAsync({
        name: newProjectName.trim()
      })
      projectId = project.id
    }

    if (!projectId) {
      toast.error('Please select a project or enter a new project name')
      return
    }

    await saveFileMutation.mutateAsync({
      projectId,
      fileType: selectedFileType,
      content
    })

    const projectName =
      newProjectName.trim() ||
      projects.find((p) => p.id === projectId)?.name ||
      'project'

    toast.success(
      `Saved to ${projectName} as ${FILE_TYPE_LABELS[selectedFileType]}`
    )
    onOpenChange(false)
    setSelectedProjectId('')
    setNewProjectName('')
    setSelectedFileType('env')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-mono sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Env Project</DialogTitle>
          <DialogDescription className="text-xs">
            Save the generated .env content to an env project for future use.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Project selection */}
          {projects.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Select existing project</Label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                disabled={!!newProjectName.trim()}
              >
                <SelectTrigger className="font-mono text-sm">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent className="font-mono">
                  {projects.map((project) => (
                    <SelectItem
                      key={project.id}
                      value={project.id}
                      className="text-xs"
                    >
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* New project name */}
          <div className="space-y-1">
            <Label className="text-xs">
              {projects.length > 0
                ? 'Or create a new project'
                : 'New project name'}
            </Label>
            <Input
              placeholder="e.g. My Next.js App"
              value={newProjectName}
              onChange={(e) => {
                setNewProjectName(e.target.value)
                if (e.target.value.trim()) setSelectedProjectId('')
              }}
              className="font-mono text-sm"
            />
          </div>

          {/* File type */}
          <div className="space-y-1">
            <Label className="text-xs">Save as</Label>
            <Select
              value={selectedFileType}
              onValueChange={(v) => setSelectedFileType(v as EnvFileType)}
            >
              <SelectTrigger className="font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-mono">
                {ENV_FILE_TYPES.map((ft) => (
                  <SelectItem key={ft} value={ft} className="text-xs">
                    {FILE_TYPE_LABELS[ft]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-border flex justify-end gap-2 border-t pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="font-mono text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                isPending || (!selectedProjectId && !newProjectName.trim())
              }
              className="font-mono text-sm"
            >
              {isPending ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : (
                <Save className="mr-2 size-3.5" />
              )}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
