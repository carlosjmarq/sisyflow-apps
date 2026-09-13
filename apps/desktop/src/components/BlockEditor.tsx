import { useEffect, useMemo, useRef, useState } from 'react'
import { useCreateBlockNote, useEditorChange } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import type { Block } from '@blocknote/core'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { markdownToBlocks } from '../lib/content'

interface BlockEditorProps {
  content: string
  contentFormat?: 'markdown' | 'blocknote'
  todoId?: string
  onChange: (content: string, contentFormat: 'blocknote') => void
}

export function BlockEditor({ content, contentFormat, todoId, onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setBlocks(null)

    async function loadBlocks() {
      if (contentFormat === 'blocknote') {
        try {
          const parsed = JSON.parse(content) as Block[]
          if (!Array.isArray(parsed)) throw new Error('Invalid blocks')
          if (!cancelled) {
            setBlocks(parsed)
            setLoading(false)
          }
          return
        } catch {
          // contenido legacy: se convierte desde markdown
        }
      }
      const converted = (await markdownToBlocks(content)) as Block[]
      if (!cancelled) {
        setBlocks(converted)
        setLoading(false)
      }
    }

    loadBlocks()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todoId])

  const editorKey = useMemo(() => todoId ? `editor-${todoId}` : 'editor-new', [todoId])

  if (loading || !blocks) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-lavender/40 animate-pulse" />
          <span className="text-xs text-nintendo-muted">
            {loading ? 'Convirtiendo contenido...' : 'Cargando editor...'}
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-coral-dark p-4">
        {error}
      </div>
    )
  }

  const safeBlocks = blocks.length > 0 ? blocks : undefined

  return (
    <div className="bn-container h-full overflow-auto" key={editorKey}>
      <BlockEditorView initialBlocks={safeBlocks} onChange={onChange} />
    </div>
  )
}

function BlockEditorView({ initialBlocks, onChange }: {
  initialBlocks: Block[] | undefined
  onChange: (content: string, contentFormat: 'blocknote') => void
}) {
  const editor = useCreateBlockNote(
    initialBlocks ? { initialContent: initialBlocks } : {}
  )
  const ready = useRef(false)

  useEditorChange(() => {
    ready.current = true
    const json = JSON.stringify(editor.document)
    onChange(json, 'blocknote')
  }, editor)

  return <BlockNoteView editor={editor} theme="light" />
}
