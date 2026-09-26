import fs from 'node:fs'
import path from 'node:path'
import type { Command } from 'commander'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '../types/supabase.js'
import { getContext } from '../lib/context.js'
import { toContentJson } from '../lib/content.js'
import { fail } from '../lib/errors.js'
import { emit } from '../lib/format.js'
import { resolveEpicId, resolveProjectId } from '../lib/resolve.js'
import {
  contentFormatSchema,
  parseDate,
  prioritySchema,
  projectStatusSchema,
  recurrenceSchema,
  todoStatusSchema,
  urgencySchema,
} from '../lib/validate.js'

const epicSchema = z.object({
  name: z.string().trim().min(1, 'El nombre de la épica no puede estar vacío'),
  color: z.string().trim().min(1).optional(),
})

const projectSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del proyecto no puede estar vacío'),
  epic: z.string().trim().min(1, 'El proyecto debe indicar su épica'),
  color: z.string().trim().min(1).optional(),
  status: projectStatusSchema.optional(),
})

const todoSchema = z.object({
  title: z.string().trim().min(1, 'El título de la tarea no puede estar vacío'),
  project: z.string().trim().min(1, 'La tarea debe indicar su proyecto'),
  status: todoStatusSchema.optional(),
  priority: prioritySchema.optional(),
  urgency: urgencySchema.optional(),
  due: z.string().optional(),
  content: z.string().optional(),
  content_format: contentFormatSchema.optional(),
  recurrence: recurrenceSchema.optional(),
  recurrence_days: z.array(z.number().int().min(1).max(7)).optional(),
})

const importSchema = z.object({
  epics: z.array(epicSchema).optional(),
  projects: z.array(projectSchema).optional(),
  todos: z.array(todoSchema).optional(),
})

type ImportPayload = z.infer<typeof importSchema>

interface ImportSummary {
  epics: { created: string[]; reused: string[] }
  projects: { created: string[]; reused: string[] }
  todos: string[]
}

export function registerImport(program: Command): void {
  program
    .command('import')
    .description('Crea épicas, proyectos y tareas en lote desde un archivo JSON')
    .argument('<file>', 'Ruta al archivo JSON')
    .action(async (file: string, _options: Record<string, unknown>, command: Command) => {
      const { client, session, json } = await getContext(command)
      const payload = readPayload(file)
      const summary: ImportSummary = { epics: { created: [], reused: [] }, projects: { created: [], reused: [] }, todos: [] }

      const epicIds = new Map<string, string>()
      for (const epic of payload.epics ?? []) {
        const existing = await findByEpicName(client, epic.name)
        if (existing) {
          epicIds.set(epic.name, existing)
          summary.epics.reused.push(existing)
          continue
        }
        const id = crypto.randomUUID()
        const { error } = await client.from('epics').insert({
          id,
          user_id: session.user.id,
          name: epic.name,
          color_code: epic.color ?? '#6750A4',
        })
        if (error) fail(`No se pudo crear la épica "${epic.name}": ${error.message}`)
        epicIds.set(epic.name, id)
        summary.epics.created.push(id)
      }

      const projectIds = new Map<string, string>()
      for (const project of payload.projects ?? []) {
        const epicId = epicIds.get(project.epic) ?? (await resolveEpicId(client, project.epic))
        const existing = await findProjectInEpic(client, project.name, epicId)
        if (existing) {
          projectIds.set(project.name, existing)
          summary.projects.reused.push(existing)
          continue
        }
        const id = crypto.randomUUID()
        const { error } = await client.from('projects').insert({
          id,
          epic_id: epicId,
          user_id: session.user.id,
          name: project.name,
          color_code: project.color ?? null,
          status: project.status ?? 'active',
        })
        if (error) fail(`No se pudo crear el proyecto "${project.name}": ${error.message}`)
        projectIds.set(project.name, id)
        summary.projects.created.push(id)
      }

      for (const todo of payload.todos ?? []) {
        const projectId = projectIds.get(todo.project) ?? (await resolveProjectId(client, todo.project))
        const id = crypto.randomUUID()
        const recurrence = todo.recurrence ?? 'none'
        if (recurrence === 'custom' && (todo.recurrence_days ?? []).length === 0) {
          fail(`La tarea "${todo.title}" es custom pero no tiene recurrence_days`, 2)
        }
        const recurrenceDays =
          recurrence === 'custom'
            ? [...new Set(todo.recurrence_days ?? [])].sort((a, b) => a - b)
            : null
        const { error } = await client.from('todos').insert({
          id,
          project_id: projectId,
          user_id: session.user.id,
          title: todo.title,
          status: todo.status ?? 'todo',
          priority: todo.priority ?? 'medium',
          urgency: todo.urgency ?? 'medium',
          recurrence,
          recurrence_days: recurrenceDays,
          expiration_date: todo.due ? parseDate(todo.due) : null,
          ...(todo.content !== undefined
            ? {
                content: toContentJson(todo.content, todo.content_format ?? 'blocknote'),
                content_format: 'blocknote',
              }
            : {}),
        })
        if (error) fail(`No se pudo crear la tarea "${todo.title}": ${error.message}`)
        summary.todos.push(id)
      }

      if (json) {
        emit({ json }, summary)
      } else {
        console.log(
          `Importación completada: ${summary.epics.created.length} épica(s) creada(s), ` +
            `${summary.epics.reused.length} reutilizada(s); ` +
            `${summary.projects.created.length} proyecto(s) creado(s), ` +
            `${summary.projects.reused.length} reutilizado(s); ${summary.todos.length} tarea(s) creada(s).`,
        )
      }
    })

  async function findByEpicName(
    supabase: SupabaseClient<Database>,
    name: string,
  ): Promise<string | null> {
    const { data, error } = await supabase.from('epics').select('id').eq('name', name).limit(1)
    if (error) fail(`No se pudo buscar la épica "${name}": ${error.message}`)
    return data && data.length > 0 ? data[0].id : null
  }

  async function findProjectInEpic(
    supabase: SupabaseClient<Database>,
    name: string,
    epicId: string,
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('name', name)
      .eq('epic_id', epicId)
      .limit(1)
    if (error) fail(`No se pudo buscar el proyecto "${name}": ${error.message}`)
    return data && data.length > 0 ? data[0].id : null
  }
}

function readPayload(file: string): ImportPayload {
  const resolved = path.resolve(file)
  let raw: string
  try {
    raw = fs.readFileSync(resolved, 'utf-8')
  } catch {
    fail(`No se pudo leer el archivo "${file}"`)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    fail(`El archivo "${file}" no es JSON válido`)
  }
  const result = importSchema.safeParse(parsed)
  if (!result.success) {
    fail(`El archivo "${file}" no cumple el esquema de importación: ${result.error.message}`, 2)
  }
  return result.data as ImportPayload
}