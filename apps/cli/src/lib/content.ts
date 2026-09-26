import { marked, type Token, type Tokens } from 'marked'
import type { Json } from '../types/supabase.js'

export type ContentFormat = 'blocknote' | 'markdown'

type StyleName = 'bold' | 'italic' | 'strikethrough' | 'code'

interface InlineText {
  type: 'text'
  text: string
  styles: Record<string, boolean>
}

interface InlineLink {
  type: 'link'
  href: string
  content: InlineText[]
}

type Inline = InlineText | InlineLink

interface BlockNoteBlock {
  type: string
  props: Record<string, Json>
  content: Inline[]
  children: BlockNoteBlock[]
}

const DEFAULT_PROPS: Record<string, Json> = {
  textColor: 'default',
  backgroundColor: 'default',
  textAlignment: 'left',
}

function block(
  type: string,
  content: Inline[],
  children: BlockNoteBlock[] = [],
  extraProps: Record<string, Json> = {},
): BlockNoteBlock {
  return { type, props: { ...DEFAULT_PROPS, ...extraProps }, content, children }
}

function textNode(text: string, styles: StyleName[] = []): InlineText {
  const record: Record<string, boolean> = {}
  for (const style of styles) record[style] = true
  return { type: 'text', text, styles: record }
}

function sameStyles(record: Record<string, boolean>, styles: StyleName[]): boolean {
  const keys = Object.keys(record)
  if (keys.length !== styles.length) return false
  return styles.every((style) => record[style] === true)
}

function pushText(nodes: Inline[], text: string, styles: StyleName[]): void {
  if (text === '') return
  const last = nodes[nodes.length - 1]
  if (last && last.type === 'text' && sameStyles(last.styles, styles)) {
    last.text += text
    return
  }
  nodes.push(textNode(text, styles))
}

function inlineToken(token: Token, styles: StyleName[], nodes: Inline[]): void {
  switch (token.type) {
    case 'text': {
      const text = token as Tokens.Text
      if (text.tokens && text.tokens.length > 0) {
        for (const child of text.tokens) inlineToken(child, styles, nodes)
      } else {
        pushText(nodes, text.text, styles)
      }
      return
    }
    case 'escape':
      pushText(nodes, (token as Tokens.Escape).text, styles)
      return
    case 'strong':
      for (const child of (token as Tokens.Strong).tokens) inlineToken(child, [...styles, 'bold'], nodes)
      return
    case 'em':
      for (const child of (token as Tokens.Em).tokens) inlineToken(child, [...styles, 'italic'], nodes)
      return
    case 'del':
      for (const child of (token as Tokens.Del).tokens) inlineToken(child, [...styles, 'strikethrough'], nodes)
      return
    case 'codespan':
      pushText(nodes, (token as Tokens.Codespan).text, [...styles, 'code'])
      return
    case 'br':
      pushText(nodes, '\n', styles)
      return
    case 'link': {
      const link = token as Tokens.Link
      const content = textNodesFromTokens(link.tokens, styles)
      if (content.length === 0) content.push(textNode(link.text, styles))
      nodes.push({ type: 'link', href: link.href, content })
      return
    }
    case 'image':
      pushText(nodes, (token as Tokens.Image).text, styles)
      return
    case 'checkbox':
      return
    default: {
      const generic = token as Tokens.Generic
      if (Array.isArray(generic.tokens) && generic.tokens.length > 0) {
        for (const child of generic.tokens) inlineToken(child, styles, nodes)
      } else if (typeof generic.text === 'string') {
        pushText(nodes, generic.text, styles)
      }
    }
  }
}

function inlineFromTokens(tokens: Token[] | undefined, styles: StyleName[] = []): Inline[] {
  const nodes: Inline[] = []
  for (const token of tokens ?? []) inlineToken(token, styles, nodes)
  return nodes
}

function textNodesFromTokens(tokens: Token[] | undefined, styles: StyleName[] = []): InlineText[] {
  const nodes = inlineFromTokens(tokens, styles)
  const texts: InlineText[] = []
  for (const node of nodes) {
    if (node.type === 'text') texts.push(node)
    else texts.push(...node.content)
  }
  return texts
}

function listBlocks(list: Tokens.List): BlockNoteBlock[] {
  const itemType = list.ordered ? 'numberedListItem' : 'bulletListItem'
  const blocks: BlockNoteBlock[] = []
  for (const item of list.items) {
    const inlineTokens: Token[] = []
    const nested: Tokens.List[] = []
    for (const token of item.tokens) {
      if (token.type === 'list') nested.push(token as Tokens.List)
      else inlineTokens.push(token)
    }
    const children = nested.flatMap((child) => listBlocks(child))
    const extraProps: Record<string, Json> = item.task ? { checked: item.checked ?? false } : {}
    blocks.push(
      block(item.task ? 'checkListItem' : itemType, inlineFromTokens(inlineTokens), children, extraProps),
    )
  }
  return blocks
}

function blockFromToken(token: Token): BlockNoteBlock[] {
  switch (token.type) {
    case 'heading': {
      const heading = token as Tokens.Heading
      const level = Math.min(Math.max(heading.depth, 1), 3)
      return [block('heading', inlineFromTokens(heading.tokens), [], { level })]
    }
    case 'paragraph':
      return [block('paragraph', inlineFromTokens((token as Tokens.Paragraph).tokens))]
    case 'blockquote': {
      const inner = blocksFromTokens((token as Tokens.Blockquote).tokens)
      if (inner.length === 0) return [block('quote', [])]
      return inner.map((item) => ({ ...item, type: 'quote' }))
    }
    case 'code': {
      const code = token as Tokens.Code
      const language = code.lang?.trim() || 'text'
      return [block('codeBlock', [textNode(code.text)], [], { language })]
    }
    case 'list':
      return listBlocks(token as Tokens.List)
    case 'hr':
      return [block('divider', [])]
    case 'table': {
      const table = token as Tokens.Table
      return [table.header, ...table.rows].map((row) =>
        block('paragraph', [textNode(row.map((cell) => cell.text).join(' | '))]),
      )
    }
    case 'html': {
      const html = (token as Tokens.HTML).text.trim()
      return html ? [block('paragraph', [textNode(html)])] : []
    }
    default: {
      const generic = token as Tokens.Generic
      if (Array.isArray(generic.tokens) && generic.tokens.length > 0) {
        return blocksFromTokens(generic.tokens)
      }
      const text = typeof generic.text === 'string' ? generic.text.trim() : ''
      return text ? [block('paragraph', [textNode(text)])] : []
    }
  }
}

function blocksFromTokens(tokens: Token[]): BlockNoteBlock[] {
  const blocks: BlockNoteBlock[] = []
  for (const token of tokens) {
    if (token.type === 'space' || token.type === 'def') continue
    blocks.push(...blockFromToken(token))
  }
  return blocks
}

/** Markdown → bloques BlockNote (subconjunto soportado por la app). */
export function markdownToBlocks(markdown: string): BlockNoteBlock[] {
  if (!markdown.trim()) return []
  return blocksFromTokens(marked.lexer(markdown))
}

/** Texto plano → un párrafo por línea no vacía. */
export function plainTextToBlocks(text: string): BlockNoteBlock[] {
  const blocks = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => block('paragraph', [textNode(line)]))
  return blocks.length > 0 ? blocks : [block('paragraph', [])]
}

function parseBlockNoteJson(text: string): BlockNoteBlock[] | null {
  if (!text.trim().startsWith('[')) return null
  try {
    const parsed: unknown = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed as BlockNoteBlock[]
  } catch {
    return null
  }
  return null
}

/**
 * Normaliza el contenido de una tarea a bloques BlockNote (formato canónico de
 * la base: `content_format = 'blocknote'`). `format` describe la ENTRADA:
 * `markdown` la parsea con marked; `blocknote` acepta JSON de bloques o texto
 * plano (un párrafo por línea).
 */
export function toContentJson(content: string, format: ContentFormat = 'blocknote'): Json {
  const blocks =
    format === 'markdown'
      ? markdownToBlocks(content)
      : (parseBlockNoteJson(content) ?? plainTextToBlocks(content))
  return blocks as unknown as Json
}
