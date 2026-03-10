'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type {
  AiExtractResponse,
  AiGeneratedSecret,
  AiSelectedKey,
  ApiSuccess
} from '@/types'
import { useMutation } from '@tanstack/react-query'
import { Bot, Loader2, Sparkles, Wand2, X } from 'lucide-react'
import { useState } from 'react'
import { sileo } from 'sileo'

const EXAMPLE_PROMPTS = [
  'Extract the OpenAI key and AWS S3 credentials',
  'Get all production database and Redis keys',
  'Export GitHub SSH key and Google Analytics tracking ID'
]

async function runAiExtract({
  prompt,
  currentProjectName
}: {
  prompt: string
  currentProjectName?: string
}): Promise<AiExtractResponse> {
  const res = await fetch('/api/ai/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, currentProjectName })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'AI extraction failed')
  }
  const json: ApiSuccess<AiExtractResponse> = await res.json()
  return json.data
}

interface AiFillPanelProps {
  onApply: (content: string) => void
  onClose: () => void
  currentProjectName?: string
}

export function AiFillPanel({
  onApply,
  onClose,
  currentProjectName
}: AiFillPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<AiExtractResponse | null>(null)

  const extractMutation = useMutation({
    mutationFn: runAiExtract,
    onSuccess: (data) => {
      setResult(data)
      if (data.selectedKeys.length === 0) {
        sileo.info({
          title: 'No matching keys found — try rephrasing your prompt'
        })
      } else {
        sileo.success({ title: `Found ${data.selectedKeys.length} key(s)` })
      }
    },
    onError: (err: Error) => sileo.error({ title: err.message })
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return
    extractMutation.mutate({ prompt, currentProjectName })
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-mono text-sm">
          <Bot className="text-primary size-4" />
          AI Generate
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-auto h-6 w-6 p-0"
          >
            <X className="size-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-primary/70 flex gap-1.5 font-mono text-xs">
          <Sparkles className="mt-0.5 size-3 shrink-0" />
          AI only sees key names and project names — never actual secret values
        </p>

        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder='e.g. "Get the OpenAI key, AWS S3 credentials, and database URL"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-20 resize-none font-mono text-xs"
          />
          <div className="flex flex-wrap gap-1.5">
            <span className="text-muted-foreground self-center font-mono text-xs">
              Examples:
            </span>
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setPrompt(ex)}
                className="border-border hover:border-primary/40 hover:bg-accent rounded border px-2 py-0.5 text-left font-mono text-xs transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!prompt.trim() || extractMutation.isPending}
              className="font-mono text-xs"
            >
              {extractMutation.isPending ? (
                <Loader2 className="mr-1.5 size-3 animate-spin" />
              ) : (
                <Wand2 className="mr-1.5 size-3" />
              )}
              {extractMutation.isPending ? 'Extracting...' : 'Extract'}
            </Button>
          </div>
        </form>

        {result &&
          !extractMutation.isPending &&
          (result.selectedKeys.length > 0 ||
            result.generatedSecrets.length > 0) && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium">
                  {result.selectedKeys.length} key(s) selected
                  {result.generatedSecrets.length > 0 &&
                    `, ${result.generatedSecrets.length} secret(s) generated`}
                </span>
                <Button
                  size="sm"
                  onClick={() => onApply(result.envContent)}
                  className="glow-green font-mono text-xs"
                >
                  <Wand2 className="mr-1.5 size-3" />
                  Apply to editor
                </Button>
              </div>
              <ul className="space-y-1">
                {result.selectedKeys.map((key: AiSelectedKey) => (
                  <li key={key.entryId} className="flex items-start gap-2">
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-primary mt-0.5 shrink-0 font-mono text-xs"
                    >
                      {key.envVarName}
                    </Badge>
                    <span className="text-muted-foreground font-mono text-xs">
                      {key.reason}
                    </span>
                  </li>
                ))}
                {result.generatedSecrets.map((s: AiGeneratedSecret) => (
                  <li key={s.envVarName} className="flex items-start gap-2">
                    <Badge
                      variant="outline"
                      className="border-yellow-500/40 text-yellow-400 mt-0.5 shrink-0 font-mono text-xs"
                    >
                      {s.envVarName}
                    </Badge>
                    <span className="text-muted-foreground font-mono text-xs">
                      {s.reason} ({s.format}, {s.bytes}B)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </CardContent>
    </Card>
  )
}
