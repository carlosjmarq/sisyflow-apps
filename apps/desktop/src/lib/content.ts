import { BlockNoteEditor } from '@blocknote/core'
import { marked } from 'marked'

/**
 * Convierte markdown legacy a bloques BlockNote. Devuelve [] si la conversión falla.
 */
export async function markdownToBlocks(content: string): Promise<unknown[]> {
  try {
    const html = marked.parse(content || '', { async: false }) as string
    const editor = BlockNoteEditor.create({})
    const blocks = await editor.tryParseHTMLToBlocks(html)
    return blocks as unknown[]
  } catch {
    return []
  }
}
