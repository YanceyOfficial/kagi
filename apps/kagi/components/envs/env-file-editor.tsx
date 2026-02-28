'use client'

import dynamic from 'next/dynamic'

// Monaco Editor must not be server-rendered
const MonacoEditor = dynamic(() => import('react-monaco-editor'), {
  ssr: false
})

interface EnvFileEditorProps {
  content: string
  onChange: (value: string) => void
  height?: number
}

export function EnvFileEditor({
  content,
  onChange,
  height = 400
}: EnvFileEditorProps) {
  return (
    <div
      className="border-border overflow-hidden rounded-md border"
      style={{ height }}
    >
      <MonacoEditor
        language="dotenv"
        value={content}
        theme="vs-dark"
        onChange={onChange}
        options={{
          readOnly: false,
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
