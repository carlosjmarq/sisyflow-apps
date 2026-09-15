import type { Command } from 'commander'
import type { Database } from '../types/supabase.js'
import { getContext } from '../lib/context.js'
import { fail } from '../lib/errors.js'
import { emit, formatDate, type Column } from '../lib/format.js'
import { resolveEpicId, resolveProjectId } from '../lib/resolve.js'
import { parseColor, parseProjectStatus } from '../lib/validate.js'

type ProjectUpdate = Database['public']['Tables']['projects']['Update']

const COLUMNS: Column[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'NOMBRE' },
  { key: 'epic', label: 'ÉPICA' },
  { key: 'status', label: 'ESTADO' },
  { key: 'color', label: 'COLOR' },
  { key: 'created', label: 'CREADO' },
]

interface ProjectOptions {
  name?: string
  epic?: string
  color?: string
  status?: string
}

interface ProjectRow {
  id: string
  epic_id: string
  name: string
  color_code: string | null
  status: string
  created_at: string
  epics?: { name: string } | null
}

function toRow(p: ProjectRow): Record<string, string> {
  return {
    id: p.id.slice(0, 8),
    name: p.name,
    epic: p.epics?.name ?? p.epic_id.slice(0, 8),
    status: p.status,
    color: p.color_code ?? '',
    created: formatDate(p.created_at),
  }
}

export function registerProject(program: Command): void {
  const project = program.command('project').description('CRUD de proyectos')

  project
    .command('create')
    .description('Crea un proyecto dentro de una épica')
    .requiredOption('--name <name>', 'Nombre del proyecto')
    .requiredOption('--epic <epic>', 'Épica (id o nombre)')
    .option('--color <color>', 'Color (hex o nombre de la paleta)')
    .option('--status <status>', 'Estado: active, paused, completed', 'active')
    .action(async (options: ProjectOptions, command: Command) => {
      const { client, session, json } = await getContext(command)
      const name = (options.name ?? '').trim()
      if (!name) fail('El nombre no puede estar vacío', 2)
      const epicId = await resolveEpicId(client, options.epic!)
      const status = parseProjectStatus(options.status!)
      const colorCode = options.color ? parseColor(options.color) : null
      const id = crypto.randomUUID()
      const { error } = await client.from('projects').insert({
        id,
        epic_id: epicId,
        user_id: session.user.id,
        name,
        color_code: colorCode,
        status,
      })
      if (error) fail(`No se pudo crear el proyecto: ${error.message}`)
      const row: ProjectRow = {
        id,
        epic_id: epicId,
        name,
        color_code: colorCode,
        status,
        created_at: new Date().toISOString(),
        epics: null,
      }
      emit({ json }, row, COLUMNS, [toRow(row)])
    })

  project
    .command('list')
    .description('Lista los proyectos (filtrables por épica)')
    .option('--epic <epic>', 'Filtra por épica (id o nombre)')
    .action(async (options: { epic?: string }, command: Command) => {
      const { client, json } = await getContext(command)
      let query = client.from('projects').select('*, epics(name)').order('created_at', { ascending: false })
      if (options.epic) {
        const epicId = await resolveEpicId(client, options.epic)
        query = query.eq('epic_id', epicId)
      }
      const { data, error } = await query
      if (error) fail(`No se pudieron cargar los proyectos: ${error.message}`)
      const rows = ((data ?? []) as unknown as ProjectRow[]).map(toRow)
      emit({ json }, data ?? [], COLUMNS, rows)
    })

  project
    .command('get')
    .description('Muestra un proyecto por id o nombre')
    .argument('<ref>', 'Id o nombre del proyecto')
    .action(async (ref: string, _options: Record<string, unknown>, command: Command) => {
      const { client, json } = await getContext(command)
      const id = await resolveProjectId(client, ref)
      const { data, error } = await client
        .from('projects')
        .select('*, epics(name)')
        .eq('id', id)
        .maybeSingle()
      if (error) fail(`No se pudo cargar el proyecto: ${error.message}`)
      if (!data) fail(`Proyecto "${ref}" no encontrado`)
      const row = data as unknown as ProjectRow
      emit({ json }, row, COLUMNS, [toRow(row)])
    })

  project
    .command('update')
    .description('Actualiza un proyecto por id o nombre')
    .argument('<ref>', 'Id o nombre del proyecto')
    .option('--name <name>', 'Nuevo nombre')
    .option('--epic <epic>', 'Nueva épica (id o nombre)')
    .option('--color <color>', 'Nuevo color (hex o nombre de la paleta)')
    .option('--status <status>', 'Nuevo estado: active, paused, completed')
    .action(async (ref: string, options: ProjectOptions, command: Command) => {
      const { client, json } = await getContext(command)
      const id = await resolveProjectId(client, ref)
      const updates: ProjectUpdate = {}
      if (options.name !== undefined) {
        const name = options.name.trim()
        if (!name) fail('El nombre no puede estar vacío', 2)
        updates.name = name
      }
      if (options.epic !== undefined) updates.epic_id = await resolveEpicId(client, options.epic)
      if (options.color !== undefined) updates.color_code = options.color ? parseColor(options.color) : null
      if (options.status !== undefined) updates.status = parseProjectStatus(options.status)
      if (Object.keys(updates).length === 0) {
        fail('Proporciona al menos --name, --epic, --color o --status', 2)
      }

      const { data, error } = await client
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select('*, epics(name)')
        .maybeSingle()
      if (error) fail(`No se pudo actualizar el proyecto: ${error.message}`)
      emit({ json }, data as unknown as ProjectRow, COLUMNS, [toRow(data as unknown as ProjectRow)])
    })

  project
    .command('delete')
    .description('Elimina un proyecto y sus tareas (cascade) por id o nombre')
    .argument('<ref>', 'Id o nombre del proyecto')
    .action(async (ref: string, _options: Record<string, unknown>, command: Command) => {
      const { client, json, yes } = await getContext(command)
      const id = await resolveProjectId(client, ref)
      if (!yes) {
        fail('Operación destructiva: eliminará también sus tareas. Añade --yes para confirmar', 2)
      }
      const { error } = await client.from('projects').delete().eq('id', id)
      if (error) fail(`No se pudo eliminar el proyecto: ${error.message}`)
      if (json) emit({ json }, { deleted: true, id })
      else console.log(`Proyecto "${ref}" eliminado (incluye sus tareas).`)
    })
}