import type { Command } from 'commander'
import type { Database } from '../types/supabase.js'
import { getContext } from '../lib/context.js'
import { fail } from '../lib/errors.js'
import { emit, formatDate, type Column } from '../lib/format.js'
import { resolveEpicId } from '../lib/resolve.js'
import { parseColor } from '../lib/validate.js'

type EpicUpdate = Database['public']['Tables']['epics']['Update']

const COLUMNS: Column[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'NOMBRE' },
  { key: 'color', label: 'COLOR' },
  { key: 'created', label: 'CREADA' },
]

const DEFAULT_COLOR = '#6750A4'

interface EpicOptions {
  name?: string
  color?: string
}

export function registerEpic(program: Command): void {
  const epic = program.command('epic').description('CRUD de épicas')

  epic
    .command('create')
    .description('Crea una épica')
    .requiredOption('--name <name>', 'Nombre de la épica')
    .option('--color <color>', 'Color (hex o nombre de la paleta)')
    .action(async (options: EpicOptions, command: Command) => {
      const { client, session, json } = await getContext(command)
      const name = (options.name ?? '').trim()
      if (!name) fail('El nombre no puede estar vacío', 2)
      const colorCode = options.color ? parseColor(options.color) : DEFAULT_COLOR
      const id = crypto.randomUUID()
      const { error } = await client.from('epics').insert({
        id,
        user_id: session.user.id,
        name,
        color_code: colorCode,
      })
      if (error) fail(`No se pudo crear la épica: ${error.message}`)
      const row = { id, name, colorCode, createdAt: new Date().toISOString() }
      emit({ json }, row, COLUMNS, [toRow(row)])
    })

  epic
    .command('list')
    .description('Lista las épicas')
    .action(async (_options: Record<string, unknown>, command: Command) => {
      const { client, json } = await getContext(command)
      const { data, error } = await client.from('epics').select('*').order('name')
      if (error) fail(`No se pudieron cargar las épicas: ${error.message}`)
      const rows = (data ?? []).map((e) => toRow({ id: e.id, name: e.name, colorCode: e.color_code, createdAt: e.created_at }))
      emit({ json }, data ?? [], COLUMNS, rows)
    })

  epic
    .command('get')
    .description('Muestra una épica por id o nombre')
    .argument('<ref>', 'Id o nombre de la épica')
    .action(async (ref: string, _options: Record<string, unknown>, command: Command) => {
      const { client, json } = await getContext(command)
      const id = await resolveEpicId(client, ref)
      const { data, error } = await client.from('epics').select('*').eq('id', id).maybeSingle()
      if (error) fail(`No se pudo cargar la épica: ${error.message}`)
      if (!data) fail(`Épica "${ref}" no encontrada`)
      const row = { id: data.id, name: data.name, colorCode: data.color_code, createdAt: data.created_at }
      emit({ json }, row, COLUMNS, [toRow(row)])
    })

  epic
    .command('update')
    .description('Actualiza una épica por id o nombre')
    .argument('<ref>', 'Id o nombre de la épica')
    .option('--name <name>', 'Nuevo nombre')
    .option('--color <color>', 'Nuevo color (hex o nombre de la paleta)')
    .action(async (ref: string, options: EpicOptions, command: Command) => {
      const { client, json } = await getContext(command)
      const id = await resolveEpicId(client, ref)
      const updates: EpicUpdate = {}
      if (options.name !== undefined) {
        const name = options.name.trim()
        if (!name) fail('El nombre no puede estar vacío', 2)
        updates.name = name
      }
      if (options.color !== undefined) updates.color_code = parseColor(options.color)
      if (Object.keys(updates).length === 0) fail('Proporciona --name y/o --color', 2)

      const { data, error } = await client.from('epics').update(updates).eq('id', id).select('*').maybeSingle()
      if (error) fail(`No se pudo actualizar la épica: ${error.message}`)
      const row = { id: data!.id, name: data!.name, colorCode: data!.color_code, createdAt: data!.created_at }
      emit({ json }, row, COLUMNS, [toRow(row)])
    })

  epic
    .command('delete')
    .description('Elimina una épica por id o nombre (falla si tiene proyectos)')
    .argument('<ref>', 'Id o nombre de la épica')
    .action(async (ref: string, _options: Record<string, unknown>, command: Command) => {
      const { client, json, yes } = await getContext(command)
      const id = await resolveEpicId(client, ref)
      const { count, error: countError } = await client
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('epic_id', id)
      if (countError) fail(`No se pudo comprobar la épica: ${countError.message}`)
      if ((count ?? 0) > 0) {
        fail(`La épica "${ref}" tiene ${count} proyecto(s). Muévelos o bórralos antes de eliminarla.`)
      }
      if (!yes) fail('Operación destructiva: añade --yes para confirmar el borrado', 2)
      const { error } = await client.from('epics').delete().eq('id', id)
      if (error) fail(`No se pudo eliminar la épica: ${error.message}`)
      if (json) emit({ json }, { deleted: true, id })
      else console.log(`Épica "${ref}" eliminada.`)
    })
}

function toRow(e: { id: string; name: string; colorCode: string; createdAt: string }): Record<string, string> {
  return {
    id: e.id.slice(0, 8),
    name: e.name,
    color: e.colorCode,
    created: formatDate(e.createdAt),
  }
}