'use client'

import dynamic from 'next/dynamic'
import type * as monacoEditor from 'monaco-editor'

// Monaco Editor must not be server-rendered
const MonacoEditor = dynamic(() => import('react-monaco-editor'), {
  ssr: false
})

interface EnvFileEditorProps {
  content: string
  onChange: (value: string) => void
  height?: number
}

let _registered = false

function registerDotenv(monaco: typeof monacoEditor) {
  if (_registered) return
  _registered = true

  // Register the language
  if (!monaco.languages.getLanguages().find((l) => l.id === 'dotenv')) {
    monaco.languages.register({ id: 'dotenv' })
  }

  // Monarch tokenizer for .env syntax
  monaco.languages.setMonarchTokensProvider('dotenv', {
    tokenizer: {
      root: [
        // Full-line comment
        [/^\s*#.*/, 'comment'],
        // Variable name (lookahead for =)
        [/[A-Za-z_][A-Za-z0-9_]*(?=\s*=)/, 'key'],
        // Equals — transition to value state
        [/\s*=\s*/, { token: 'delimiter', next: '@value' }],
        // Bare whitespace / blank lines
        [/\s+/, '']
      ],
      value: [
        // Double-quoted string
        [/"[^"]*"/, { token: 'string', next: '@pop' }],
        // Single-quoted string
        [/'[^']*'/, { token: 'string', next: '@pop' }],
        // Backtick string
        [/`[^`]*`/, { token: 'string', next: '@pop' }],
        // Inline comment that follows a value
        [/\s+#.*/, { token: 'comment', next: '@pop' }],
        // Unquoted value (stop before newline)
        [/[^\n\r]+/, { token: 'value', next: '@pop' }]
      ]
    }
  })

  // Matrix-style dark theme
  monaco.editor.defineTheme('kagi-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '4b5563', fontStyle: 'italic' },
      { token: 'key', foreground: '4ade80', fontStyle: 'bold' },
      { token: 'delimiter', foreground: '4b5563' },
      { token: 'string', foreground: 'fbbf24' },
      { token: 'value', foreground: 'a3e635' }
    ],
    colors: {
      'editor.background': '#0d0d0d',
      'editor.foreground': '#d1fae5',
      'editor.lineHighlightBackground': '#14251a',
      'editor.selectionBackground': '#1a3a2a',
      'editorCursor.foreground': '#4ade80',
      'editorLineNumber.foreground': '#374151',
      'editorLineNumber.activeForeground': '#4ade80',
      'editorIndentGuide.background1': '#1f2937',
      'editorWhitespace.foreground': '#1f2937'
    }
  })
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
        theme="kagi-dark"
        onChange={onChange}
        editorDidMount={(_editor, monaco) => registerDotenv(monaco)}
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
          renderLineHighlight: 'line',
          scrollbar: { vertical: 'auto', horizontal: 'hidden' },
          padding: { top: 12, bottom: 12 }
        }}
      />
    </div>
  )
}
