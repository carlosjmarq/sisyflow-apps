import type { Command } from 'commander'
import type { Database } from '../types/supabase.js'
import { getContext } from '../lib/context.js'
import { toContentJson } from '../lib/content.js'
import { fail } from '../lib/errors.js'
import { emit, formatDate, truncate, type Column } from '../lib/format.js'
import { resolveProjectId } from '../lib/resolve.js'
import {
  parseContentFormat,
  parseDate,
  parsePriority,
  parseRecurrence,
  parseTodoStatus,
  parseUrgency,
  parseWeekdays,
} from '../lib/validate.js'

type TodoUpdate = Database['public']['Tables']['todos']['Update']

const COLUMNS: Column[] = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'TÍTULO' },
  { key: 'status', label: 'ESTADO' },
  { key: 'priority', label: 'PRIORIDAD' },
  { key: 'recurrence', label: 'REPETICIÓN' },
  { key: 'days', label: 'DÍAS' },
  { key: 'project', label: 'PROYECTO' },
  { key: 'due', label: 'VENCE' },
]

const WEEKDAY_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function formatDays(days: number[] | null | undefined): string {
  if (!days || days.length === 0) return '—'
  return [...new Set(days)].sort((a, b) => a - b).map((day) => WEEKDAY_SHORT[day - 1] ?? '?').join('')
}

const CHECK_COLUMNS: Column[] = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'TÍTULO' },
  { key: 'completed_at', label: 'COMPLETADO' },
]

interface TodoOptions {
  title?: string
  project?: string
  status?: string
  priority?: string
  urgency?: string
  recurrence?: string
  due?: string
  content?: string
  contentFormat?: string
  days?: string
}

interface TodoRow {
  id: string
  title: string
  status: string
  priority: string
  urgency: string
  recurrence: string
  recurrence_days?: number[] | null
  expiration_date: string | null
  created_at: string
  projects?: { name: string } | null
}

function toRow(t: TodoRow): Record<string, string> {
  return {
    id: t.id.slice(0, 8),
    title: truncate(t.title, 40),
    status: t.status,
    priority: t.priority,
    recurrence: t.recurrence,
    days: formatDays(t.recurrence_days),
    project: t.projects?.name ?? t.id.slice(0, 8),
    due: formatDate(t.expiration_date),
  }
}

export function registerTodo(program: Command): void {
  const todo = program.command('todo').description('CRUD de tareas')

  todo
    .command('create')
    .description('Crea una tarea dentro de un proyecto')
    .requiredOption('--title <title>', 'Título de la tarea')
    .requiredOption('--project <project>', 'Proyecto (id o nombre)')
    .option('--status <status>', 'Estado: backlog, todo, in-progress, done, cancelled', 'todo')
    .option('--priority <priority>', 'Prioridad: low, medium, high, critical', 'medium')
    .option('--urgency <urgency>', 'Urgencia: low, medium, high, critical', 'medium')
    .option('--recurrence <recurrence>', 'Repetición: none, daily, weekdays, weekly, monthly, custom', 'none')
    .option('--days <days>', 'Días de la semana para custom (lun,mar o 1,2)')
    .option('--due <date>', 'Fecha de expiración (YYYY-MM-DD o ISO 8601)')
    .option('--content <text>', 'Contenido de la tarea (texto)')
    .option('--content-format <format>', 'Formato del contenido: blocknote, markdown', 'blocknote')
    .action(async (options: TodoOptions, command: Command) => {
      const { client, session, json } = await getContext(command)
      const title = (options.title ?? '').trim()
      if (!title) fail('El título no puede estar vacío', 2)
      const projectId = await resolveProjectId(client, options.project!)
      const status = parseTodoStatus(options.status!)
      const priority = parsePriority(options.priority!)
      const urgency = parseUrgency(options.urgency!)
      const recurrence = parseRecurrence(options.recurrence!)
      const recurrenceDays = options.days ? parseWeekdays(options.days) : []
      if (recurrence === 'custom' && recurrenceDays.length === 0) {
        fail('--recurrence custom requiere --days (ej. --days lun,mar)', 2)
      }
      const storedDays = recurrence === 'custom' ? recurrenceDays : null
      const content =
        options.content !== undefined
          ? toContentJson(options.content, parseContentFormat(options.contentFormat!))
          : undefined
      const expirationDate = options.due ? parseDate(options.due) : null
      const id = crypto.randomUUID()
      const { error } = await client.from('todos').insert({
        id,
        project_id: projectId,
        user_id: session.user.id,
        title,
        status,
        priority,
        urgency,
        recurrence,
        recurrence_days: storedDays,
        expiration_date: expirationDate,
        ...(content !== undefined ? { content, content_format: 'blocknote' } : {}),
      })
      if (error) fail(`No se pudo crear la tarea: ${error.message}`)
      const row: TodoRow = {
        id,
        title,
        status,
        priority,
        urgency,
        recurrence,
        recurrence_days: storedDays,
        expiration_date: expirationDate,
        created_at: new Date().toISOString(),
        projects: null,
      }
      emit({ json }, row, COLUMNS, [toRow(row)])
    })

  todo
    .command('list')
    .description('Lista las tareas (filtrables por proyecto y estado)')
    .option('--project <project>', 'Filtra por proyecto (id o nombre)')
    .option('--status <status>', 'Filtra por estado')
    .action(async (options: { project?: string; status?: string }, command: Command) => {
      const { client, json } = await getContext(command)
      let query = client
        .from('todos')
        .select('*, projects(name)')
        .order('created_at', { ascending: false })
      if (options.project) {
        const projectId = await resolveProjectId(client, options.project)
        query = query.eq('project_id', projectId)
      }
      if (options.status) query = query.eq('status', parseTodoStatus(options.status))
      const { data, error } = await query.limit(500)
      if (error) fail(`No se pudieron cargar las tareas: ${error.message}`)
      const rows = ((data ?? []) as unknown as TodoRow[]).map(toRow)
      emit({ json }, data ?? [], COLUMNS, rows)
    })

  todo
    .command('get')
    .description('Muestra una tarea por id')
    .argument('<id>', 'Id de la tarea')
    .action(async (id: string, _options: Record<string, unknown>, command: Command) => {
      const { client, json } = await getContext(command)
      const { data, error } = await client
        .from('todos')
        .select('*, projects(name)')
        .eq('id', id)
        .maybeSingle()
      if (error) fail(`No se pudo cargar la tarea: ${error.message}`)
      if (!data) fail(`Tarea "${id}" no encontrada`)
      const row = data as unknown as TodoRow
      emit({ json }, row, COLUMNS, [toRow(row)])
    })

  todo
    .command('update')
    .description('Actualiza una tarea por id')
    .argument('<id>', 'Id de la tarea')
    .option('--title <title>', 'Nuevo título')
    .option('--status <status>', 'Nuevo estado')
    .option('--priority <priority>', 'Nueva prioridad')
    .option('--urgency <urgency>', 'Nueva urgencia')
    .option('--recurrence <recurrence>', 'Nueva repetición: none, daily, weekdays, weekly, monthly, custom')
    .option('--days <days>', 'Días de la semana para custom (lun,mar o 1,2)')
    .option('--due <date>', 'Nueva fecha de expiración')
    .option('--content <text>', 'Nuevo contenido')
    .option('--content-format <format>', 'Formato del contenido: blocknote, markdown')
    .action(async (id: string, options: TodoOptions, command: Command) => {
      const { client, json } = await getContext(command)
      const updates: TodoUpdate = {}
      if (options.title !== undefined) {
        const title = options.title.trim()
        if (!title) fail('El título no puede estar vacío', 2)
        updates.title = title
      }
      if (options.status !== undefined) updates.status = parseTodoStatus(options.status)
      if (options.priority !== undefined) updates.priority = parsePriority(options.priority)
      if (options.urgency !== undefined) updates.urgency = parseUrgency(options.urgency)
      const nextRecurrence =
        options.recurrence !== undefined ? parseRecurrence(options.recurrence) : undefined
      if (nextRecurrence !== undefined) updates.recurrence = nextRecurrence
      if (nextRecurrence !== undefined || options.days !== undefined) {
        if ((nextRecurrence ?? 'custom') === 'custom') {
          if (options.days === undefined) fail('Para recurrencia custom pasá --days (ej. --days lun,mar)', 2)
          updates.recurrence_days = parseWeekdays(options.days)
        } else {
          updates.recurrence_days = null
        }
      }
      if (options.due !== undefined) updates.expiration_date = options.due ? parseDate(options.due) : null
      if (options.content !== undefined) {
        const format = options.contentFormat ? parseContentFormat(options.contentFormat) : 'blocknote'
        updates.content = toContentJson(options.content, format)
        updates.content_format = 'blocknote'
      }
      if (Object.keys(updates).length === 0) {
        fail('Proporciona al menos un campo a actualizar', 2)
      }

      const { data, error } = await client
        .from('todos')
        .update(updates)
        .eq('id', id)
        .select('*, projects(name)')
        .maybeSingle()
      if (error) fail(`No se pudo actualizar la tarea: ${error.message}`)
      emit({ json }, data as unknown as TodoRow, COLUMNS, [toRow(data as unknown as TodoRow)])
    })

  todo
    .command('check')
    .description('Registra un completado de una tarea recurrente')
    .argument('<id>', 'Id de la tarea')
    .action(async (id: string, _options: Record<string, unknown>, command: Command) => {
      const { client, session, json } = await getContext(command)
      const { data, error } = await client
        .from('todos')
        .select('id, title, recurrence')
        .eq('id', id)
        .maybeSingle()
      if (error) fail(`No se pudo cargar la tarea: ${error.message}`)
      if (!data) fail(`Tarea "${id}" no encontrada`)
      if (data.recurrence === 'none') {
        fail('La tarea no es recurrente: actualízala con --recurrence para poder completarla repetidas veces')
      }

      const completionId = crypto.randomUUID()
      const { error: insertError } = await client.from('todo_completions').insert({
        id: completionId,
        todo_id: id,
        user_id: session.user.id,
      })
      if (insertError) fail(`No se pudo registrar el completado: ${insertError.message}`)

      const row = {
        id: completionId,
        title: data.title,
        completed_at: new Date().toISOString(),
      }
      emit({ json }, row, CHECK_COLUMNS, [
        {
          id: completionId.slice(0, 8),
          title: truncate(data.title, 40),
          completed_at: formatDate(row.completed_at),
        },
      ])
    })

  todo
    .command('delete')
    .description('Elimina una tarea por id')
    .argument('<id>', 'Id de la tarea')
    .action(async (id: string, _options: Record<string, unknown>, command: Command) => {
      const { client, json } = await getContext(command)
      const { error } = await client.from('todos').delete().eq('id', id)
      if (error) fail(`No se pudo eliminar la tarea: ${error.message}`)
      if (json) emit({ json }, { deleted: true, id })
      else console.log(`Tarea "${id}" eliminada.`)
    })
}