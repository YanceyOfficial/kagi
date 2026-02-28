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
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import type { AiExtractResponse, AiSelectedKey, ApiSuccess } from '@/types'
import { useMutation } from '@tanstack/react-query'
import { Bot, Copy, Download, Loader2, Sparkles, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { EnvPreview } from './env-preview'

const EXAMPLE_PROMPTS = [
  'Extract the OpenAI key and AWS S3 credentials for the Blog project',
  'Get all production keys for the Main App project as a Next.js .env file',
  'Export GitHub SSH key and Google Analytics key for the Marketing site'
]

async function runAiExtract(prompt: string): Promise<AiExtractResponse> {
  const res = await fetch('/api/ai/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'AI extraction failed')
  }
  const json: ApiSuccess<AiExtractResponse> = await res.json()
  return json.data
}

export function AiExtractClient() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<AiExtractResponse | null>(null)

  const extractMutation = useMutation({
    mutationFn: runAiExtract,
    onSuccess: (data) => {
      setResult(data)
      if (data.selectedKeys.length === 0) {
        toast.info('No matching keys found — try rephrasing your prompt')
      } else {
        toast.success(`Found ${data.selectedKeys.length} key(s)`)
      }
    },
    onError: (err: Error) => toast.error(err.message)
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return
    extractMutation.mutate(prompt)
  }

  function handleCopyEnv() {
    if (!result) return
    navigator.clipboard.writeText(result.envContent)
    toast.success('Copied .env content to clipboard')
  }

  function handleDownloadEnv() {
    if (!result) return
    const blob = new Blob([result.envContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.env'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-mono text-2xl font-bold">
          <Bot className="text-primary size-6" />
          AI Key Extractor
        </h1>
        <p className="text-muted-foreground mt-1 font-mono text-sm">
          Describe which keys you need — the AI selects them, never seeing the
          actual values
        </p>
      </div>

      {/* Security note */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent>
          <p className="text-primary/80 flex gap-2 font-mono text-xs">
            <Sparkles className="mt-0.5 size-3.5 shrink-0" />
            <span>
              <strong>Privacy-first:</strong> The AI only sees key names and
              project names — never the actual secret values. Keys are decrypted
              server-side after the AI selects them.
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Prompt input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder='Describe what you need, e.g.: "Extract the OpenAI key, Google Analytics tracking ID, and AWS S3 credentials for the Blog Next.js project"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-28 resize-none font-mono text-sm"
        />

        {/* Example prompts */}
        <div className="flex flex-wrap gap-2">
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
            disabled={!prompt.trim() || extractMutation.isPending}
            className="glow-green font-mono"
          >
            {extractMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 size-4" />
            )}
            {extractMutation.isPending ? 'Extracting...' : 'Extract Keys'}
          </Button>
        </div>
      </form>

      {/* Results */}
      {extractMutation.isPending && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {result && !extractMutation.isPending && (
        <div className="space-y-4">
          {/* Selected keys summary */}
          <Card className="border-border bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-mono text-sm">
                <Wand2 className="text-primary size-4" />
                AI Selection
                <Badge className="ml-auto font-mono text-xs">
                  {result.selectedKeys.length} key(s)
                </Badge>
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                Keys selected by the AI based on your prompt
              </CardDescription>
            </CardHeader>
            {result.selectedKeys.length > 0 && (
              <CardContent>
                <ul className="space-y-1.5">
                  {result.selectedKeys.map((key) => (
                    <SelectedKeyRow key={key.entryId} selectedKey={key} />
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>

          {/* .env preview */}
          {result.selectedKeys.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-medium">.env Output</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyEnv}
                    className="font-mono text-xs"
                  >
                    <Copy className="mr-1.5 size-3" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadEnv}
                    className="font-mono text-xs"
                  >
                    <Download className="mr-1.5 size-3" />
                    Download .env
                  </Button>
                </div>
              </div>
              <EnvPreview content={result.envContent} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SelectedKeyRow({ selectedKey }: { selectedKey: AiSelectedKey }) {
  return (
    <li className="hover:bg-accent flex items-start gap-3 rounded-md px-2 py-1.5">
      <Badge
        variant="outline"
        className="border-primary/30 text-primary mt-0.5 shrink-0 font-mono text-xs"
      >
        {selectedKey.envVarName}
      </Badge>
      <span className="text-muted-foreground font-mono text-xs">
        {selectedKey.reason}
      </span>
    </li>
  )
}
