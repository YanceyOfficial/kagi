'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Copy, RefreshCw, Wand2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { sileo } from 'sileo'

type Format = 'hex' | 'base64' | 'base64url' | 'alphanumeric'

const BYTE_LENGTHS = [16, 24, 32, 48, 64] as const
type ByteLength = (typeof BYTE_LENGTHS)[number]

const FORMAT_LABELS: Record<Format, string> = {
  hex: 'hex',
  base64: 'base64',
  base64url: 'base64url',
  alphanumeric: 'alphanumeric'
}

const ALPHANUM_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function generate(bytes: ByteLength, format: Format): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)

  switch (format) {
    case 'hex':
      return Array.from(buf)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

    case 'base64':
      return btoa(String.fromCharCode(...buf))

    case 'base64url':
      return btoa(String.fromCharCode(...buf))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

    case 'alphanumeric': {
      // Rejection-sampling to avoid modulo bias
      const result: string[] = []
      const extra = new Uint8Array(bytes * 2)
      crypto.getRandomValues(extra)
      for (const byte of extra) {
        if (result.length === bytes) break
        if (byte < 248)
          result.push(ALPHANUM_CHARS[byte % ALPHANUM_CHARS.length])
      }
      // Fallback if extra wasn't enough (extremely rare)
      while (result.length < bytes) {
        const b = new Uint8Array(1)
        crypto.getRandomValues(b)
        if (b[0] < 248)
          result.push(ALPHANUM_CHARS[b[0] % ALPHANUM_CHARS.length])
      }
      return result.join('')
    }
  }
}

function outputLength(bytes: ByteLength, format: Format): number {
  switch (format) {
    case 'hex':
      return bytes * 2
    case 'base64':
      return Math.ceil(bytes / 3) * 4
    case 'base64url':
      return Math.ceil((bytes * 4) / 3) // no padding
    case 'alphanumeric':
      return bytes
  }
}

interface SecretGeneratorProps {
  /** If provided, clicking Insert writes the secret into the editor. */
  onInsert?: (secret: string) => void
}

export function SecretGenerator({ onInsert }: SecretGeneratorProps) {
  const [bytes, setBytes] = useState<ByteLength>(32)
  const [format, setFormat] = useState<Format>('hex')
  const [secret, setSecret] = useState(() => generate(32, 'hex'))

  const regenerate = useCallback(() => {
    setSecret(generate(bytes, format))
  }, [bytes, format])

  function handleBytesChange(v: string) {
    const b = Number(v) as ByteLength
    setBytes(b)
    setSecret(generate(b, format))
  }

  function handleFormatChange(v: string) {
    const f = v as Format
    setFormat(f)
    setSecret(generate(bytes, f))
  }

  function handleCopy() {
    navigator.clipboard.writeText(secret)
    sileo.success({ title: 'Copied to clipboard' })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="font-mono text-xs">
          <Wand2 className="mr-1.5 size-3" />
          Secret
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-4 font-mono" align="start">
        <p className="mb-3 text-xs font-semibold">Secret Generator</p>

        <div className="mb-3 flex gap-2">
          {/* Byte length */}
          <div className="flex-1 space-y-1">
            <Label className="text-muted-foreground text-xs">Bytes</Label>
            <Select value={String(bytes)} onValueChange={handleBytesChange}>
              <SelectTrigger className="h-7 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-mono text-xs">
                {BYTE_LENGTHS.map((b) => (
                  <SelectItem key={b} value={String(b)} className="text-xs">
                    {b} bytes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div className="flex-1 space-y-1">
            <Label className="text-muted-foreground text-xs">Format</Label>
            <Select value={format} onValueChange={handleFormatChange}>
              <SelectTrigger className="h-7 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-mono text-xs">
                {(Object.keys(FORMAT_LABELS) as Format[]).map((f) => (
                  <SelectItem key={f} value={f} className="text-xs">
                    {FORMAT_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Output */}
        <div className="bg-muted/40 border-border mb-3 rounded border p-2">
          <p className="text-primary font-mono text-xs leading-relaxed break-all">
            {secret}
          </p>
          <p className="text-muted-foreground mt-1 text-[10px]">
            {outputLength(bytes, format)} chars · {bytes} bytes of entropy
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={regenerate}
            className="h-7 flex-1 font-mono text-xs"
          >
            <RefreshCw className="mr-1.5 size-3" />
            Regenerate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-7 flex-1 font-mono text-xs"
          >
            <Copy className="mr-1.5 size-3" />
            Copy
          </Button>
          {onInsert && (
            <Button
              size="sm"
              onClick={() => onInsert(secret)}
              className="h-7 flex-1 font-mono text-xs"
            >
              Insert
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
