import type { Json } from '../types/supabase.js'

export function toContentJson(text: string): Json {
  return [
    { type: 'paragraph', content: [{ type: 'text', text }] },
  ] as unknown as Json
}