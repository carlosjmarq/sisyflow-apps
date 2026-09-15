import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase.js'
import { fail } from './errors.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function looksLikeUuid(value: string): boolean {
  return UUID_RE.test(value)
}

export async function resolveEpicId(supabase: SupabaseClient<Database>, ref: string): Promise<string> {
  if (looksLikeUuid(ref)) return ref

  const { data, error } = await supabase.from('epics').select('id').eq('name', ref)
  if (error) fail(`No se pudo buscar la épica "${ref}": ${error.message}`)
  if (!data || data.length === 0) {
    fail(`Épica "${ref}" no encontrada. Crea una con: sisyflow epic create --name "${ref}"`)
  }
  if (data.length > 1) {
    fail(
      `Hay ${data.length} épicas llamadas "${ref}". Usa su id exacto: ` +
        data.map((e) => e.id).join(', '),
    )
  }
  return data[0].id
}

export async function resolveProjectId(supabase: SupabaseClient<Database>, ref: string): Promise<string> {
  if (looksLikeUuid(ref)) return ref

  const { data, error } = await supabase.from('projects').select('id').eq('name', ref)
  if (error) fail(`No se pudo buscar el proyecto "${ref}": ${error.message}`)
  if (!data || data.length === 0) {
    fail(`Proyecto "${ref}" no encontrado. Crea uno con: sisyflow project create --name "${ref}"`)
  }
  if (data.length > 1) {
    fail(
      `Hay ${data.length} proyectos llamados "${ref}". Usa su id exacto: ` +
        data.map((p) => p.id).join(', '),
    )
  }
  return data[0].id
}