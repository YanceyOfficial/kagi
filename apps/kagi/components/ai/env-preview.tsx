'use client'

import dynamic from 'next/dynamic'

// Monaco Editor must not be server-rendered
const MonacoEditor = dynamic(() => import('react-monaco-editor'), {
  ssr: false
})

interface EnvPreviewProps {
  content: string
  readOnly?: boolean
}

export function EnvPreview({ content, readOnly = true }: EnvPreviewProps) {
  const lineCount = content.split('\n').length
  const editorHeight = Math.max(200, Math.min(lineCount * 19 + 40, 600))

  return (
    <div
      className="border-border overflow-hidden rounded-md border"
      style={{ height: editorHeight }}
    >
      <MonacoEditor
        language="dotenv"
        value={content}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 12,
          fontFamily: 'var(--font-geist-mono), monospace',
          lineNumbers: 'on',
          wordWrap: 'on',
          folding: false,
          glyphMargin: false,
          lineDecorationsWidth: 0,
          renderLineHighlight: 'line',
          scrollbar: { vertical: 'auto', horizontal: 'hidden' },
          padding: { top: 12, bottom: 12 }
        }}
      />
    </div>
  )
}
