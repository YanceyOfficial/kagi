'use client'

import { Button } from '@/components/ui/button'
import {
  useDeleteEnvFile,
  useRevealEnvFile,
  useSaveEnvFile
} from '@/lib/hooks/use-envs'
import type { EnvFile, EnvFileType } from '@/types'
import { Bot, Copy, Download, Eye, Loader2, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { sileo } from 'sileo'
import { AiFillPanel } from './ai-fill-panel'
import { EnvFileEditor } from './env-file-editor'
import { SecretGenerator } from './secret-generator'

interface EnvFileTabProps {
  projectId: string
  fileType: EnvFileType
  existingFile: EnvFile | undefined
}

export function EnvFileTab({
  projectId,
  fileType,
  existingFile
}: EnvFileTabProps) {
  const [revealedContent, setRevealedContent] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<string>('')
  const [aiOpen, setAiOpen] = useState(false)
  const [forceEditorOpen, setForceEditorOpen] = useState(false)

  const revealMutation = useRevealEnvFile()
  const saveMutation = useSaveEnvFile()
  const deleteMutation = useDeleteEnvFile()

  const showEditor =
    !existingFile || revealedContent !== null || forceEditorOpen

  async function handleReveal() {
    if (!existingFile) return
    const data = await revealMutation.mutateAsync({
      projectId,
      fileId: existingFile.id
    })
    setRevealedContent(data.content)
    setEditContent(data.content)
  }

  async function handleSave() {
    if (!editContent.trim()) {
      sileo.error({ title: 'Nothing to save — add some content first' })
      return
    }
    await saveMutation.mutateAsync({
      projectId,
      fileType,
      content: editContent
    })
    setRevealedContent(editContent)
    setForceEditorOpen(false)
  }

  async function handleDelete() {
    if (!existingFile) return
    await deleteMutation.mutateAsync({
      projectId,
      fileId: existingFile.id
    })
    setRevealedContent(null)
    setEditContent('')
    setForceEditorOpen(false)
  }

  function handleCopy() {
    const content = revealedContent ?? editContent
    if (!content) return
    navigator.clipboard.writeText(content)
    sileo.success({ title: 'Copied to clipboard' })
  }

  function handleDownload() {
    const content = revealedContent ?? editContent
    if (!content) return
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `.${fileType}`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleAiApply(content: string) {
    setEditContent(content)
    setForceEditorOpen(true)
    setAiOpen(false)
  }

  return (
    <div className="space-y-3">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        {showEditor && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending || !editContent.trim()}
            className="font-mono text-xs"
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-1.5 size-3 animate-spin" />
            ) : (
              <Save className="mr-1.5 size-3" />
            )}
            Save
          </Button>
        )}

        {existingFile && !showEditor && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleReveal}
            disabled={revealMutation.isPending}
            className="font-mono text-xs"
          >
            {revealMutation.isPending ? (
              <Loader2 className="mr-1.5 size-3 animate-spin" />
            ) : (
              <Eye className="mr-1.5 size-3" />
            )}
            Reveal to edit
          </Button>
        )}

        {showEditor && editContent && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="font-mono text-xs"
            >
              <Copy className="mr-1.5 size-3" />
              Copy
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="font-mono text-xs"
            >
              <Download className="mr-1.5 size-3" />
              Download
            </Button>
          </>
        )}

        {showEditor && (
          <SecretGenerator
            onInsert={(secret) =>
              setEditContent((prev) =>
                prev ? `${prev.trimEnd()}\n${secret}` : secret
              )
            }
          />
        )}

        <Button
          size="sm"
          variant={aiOpen ? 'default' : 'outline'}
          onClick={() => setAiOpen((v) => !v)}
          className="font-mono text-xs"
        >
          <Bot className="mr-1.5 size-3" />
          AI Generate
        </Button>

        {existingFile && revealedContent !== null && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-destructive hover:text-destructive ml-auto font-mono text-xs"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="mr-1.5 size-3 animate-spin" />
            ) : (
              <Trash2 className="mr-1.5 size-3" />
            )}
            Delete file
          </Button>
        )}
      </div>

      {/* AI panel */}
      {aiOpen && (
        <AiFillPanel onApply={handleAiApply} onClose={() => setAiOpen(false)} />
      )}

      {/* Editor or placeholder */}
      {showEditor ? (
        <EnvFileEditor
          content={editContent}
          onChange={setEditContent}
          height={400}
        />
      ) : existingFile ? (
        <div className="border-border bg-muted/20 flex flex-col items-center justify-center rounded-md border py-16 text-center">
          <p className="font-mono text-sm font-medium">File saved</p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            Click &ldquo;Reveal to edit&rdquo; to decrypt and view the content
          </p>
        </div>
      ) : (
        <div className="border-border bg-muted/20 flex flex-col items-center justify-center rounded-md border py-16 text-center">
          <p className="font-mono text-sm font-medium">Nothing saved yet</p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            Start typing in the editor above and click Save
          </p>
        </div>
      )}
    </div>
  )
}
