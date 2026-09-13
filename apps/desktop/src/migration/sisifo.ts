import type { PostgrestError } from '@supabase/supabase-js'
import { db, type LegacyData } from '../db/database'
import { supabase } from '../lib/supabase'
import { markdownToBlocks } from '../lib/content'
import { DEFAULT_HEX, PROJECT_COLORS } from '../types'
import { toIso, type EpicInsert, type ProjectInsert, type TagInsert, type TodoInsert } from '../data/mappers'
import type { Json } from '../types/supabase'

export const SISIFO_MARKER_KEY = 'sisyflow.sisifo.migratedAt'

export interface LocalSummary {
  projects: number
  todos: number
  epics: number
  tags: number
}

export interface MigrationReport {
  epics: number
  projects: number
  todos: number
  tags: number
  ambiguousProjects: string[]
  contentConversions: number
}

export interface MigrationRows {
  epics: EpicInsert[]
  projects: ProjectInsert[]
  todos: TodoInsert[]
  tags: TagInsert[]
}

export function getMigrationMarker(): string | null {
  return localStorage.getItem(SISIFO_MARKER_KEY)
}

export function setMigrationMarker(value = new Date().toISOString()): string {
  localStorage.setItem(SISIFO_MARKER_KEY, value)
  return value
}

/**
 * UUID determinista (mismo input → mismo uuid) para que la migración y el
 * import de backups sean reintentables sin duplicar datos (ADR-009).
 */
function stableUuid(input: string): string {
  const parts: string[] = []
  let seed = 0x811c9dc5
  for (let k = 0; k < 4; k++) {
    let h = (seed ^ Math.imul(k + 1, 0x9e3779b9)) >>> 0
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i)
      h = Math.imul(h, 0x01000193) >>> 0
    }
    parts.push(h.toString(16).padStart(8, '0'))
    seed = h
  }
  const hex = parts.join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

function hexFromLegacyColor(color: string): string {
  return PROJECT_COLORS.find((c) => c.value === color)?.bg ?? (color.startsWith('#') ? color : DEFAULT_HEX)
}

export async function getLocalSummary(): Promise<LocalSummary> {
  const [projects, todos, epics, tags] = await Promise.all([
    db.projects.count(),
    db.todos.count(),
    db.epics.count(),
    db.tags.count(),
  ])
  return { projects, todos, epics, tags }
}

export async function upsertInChunks<T>(
  label: string,
  rows: T[],
  upsert: (chunk: T[]) => PromiseLike<{ error: PostgrestError | null }>,
  onProgress?: (step: string) => void
): Promise<void> {
  const CHUNK_SIZE = 100
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE)
    onProgress?.(`${label}: ${Math.min(i + CHUNK_SIZE, rows.length)}/${rows.length}`)
    const { error } = await upsert(chunk)
    if (error) throw new Error(`Error al migrar ${label.toLowerCase()}: ${error.message}`)
  }
}

export async function buildMigrationRows(
  data: LegacyData,
  userId: string
): Promise<{ rows: MigrationRows; report: MigrationReport }> {
  const ambiguousProjects: string[] = []
  let contentConversions = 0

  const epicIdByKey = new Map<string, string>()
  const epicRows: EpicInsert[] = []

  const ensureEpic = (key: string, displayName: string): string => {
    const existing = epicIdByKey.get(key)
    if (existing) return existing
    const id = stableUuid(`sisyflow:epic:${key}`)
    epicIdByKey.set(key, id)
    epicRows.push({
      id,
      user_id: userId,
      name: displayName,
      color_code: PROJECT_COLORS[epicRows.length % PROJECT_COLORS.length].bg,
    })
    return id
  }

  data.epics.forEach((epic) => {
    const key = normalizeName(epic.name)
    if (key) ensureEpic(key, epic.name.trim())
  })

  const legacyEpicIdsByProject = new Map<number, number[]>()
  data.epics.forEach((epic) => {
    if (epic.id == null) return
    const list = legacyEpicIdsByProject.get(epic.projectId) ?? []
    list.push(epic.id)
    legacyEpicIdsByProject.set(epic.projectId, list)
  })

  const projectIdByLocalId = new Map<number, string>()
  const projectRows: ProjectInsert[] = data.projects.map((project) => {
    const id = stableUuid(`sisyflow:project:${project.id ?? `${project.name}:${project.createdAt}`}`)
    if (project.id != null) projectIdByLocalId.set(project.id, id)

    const localEpicIds = (legacyEpicIdsByProject.get(project.id ?? -1) ?? []).sort((a, b) => a - b)
    let epicKey = ''
    if (localEpicIds.length > 0) {
      const oldest = data.epics.find((e) => e.id === localEpicIds[0])
      epicKey = normalizeName(oldest?.name ?? '')
      const distinctNames = new Set(
        localEpicIds.map((epicId) => normalizeName(data.epics.find((e) => e.id === epicId)?.name ?? ''))
      )
      if (distinctNames.size > 1) ambiguousProjects.push(project.name)
    }
    if (!epicKey) epicKey = 'general'
    ensureEpic(epicKey, epicKey === 'general' ? 'General' : epicKey)

    return {
      id,
      user_id: userId,
      epic_id: epicIdByKey.get(epicKey)!,
      name: project.name,
      color_code: hexFromLegacyColor(project.color),
      status: 'active',
      created_at: toIso(project.createdAt),
    }
  })

  const todoRows: TodoInsert[] = []
  for (const todo of data.todos) {
    let content: Json | null = null
    if (todo.contentFormat !== 'markdown') {
      try {
        const parsed = JSON.parse(todo.content) as unknown
        if (Array.isArray(parsed)) content = parsed as Json
      } catch {
        content = null
      }
    }
    if (!content) {
      content = (await markdownToBlocks(todo.content)) as unknown as Json
      contentConversions++
    }

    todoRows.push({
      id: stableUuid(`sisyflow:todo:${todo.id ?? `${todo.title}:${todo.createdAt}`}`),
      user_id: userId,
      project_id: projectIdByLocalId.get(todo.projectId) ?? stableUuid(`sisyflow:project:${todo.projectId}`),
      title: todo.title,
      status: todo.status,
      priority: todo.priority,
      urgency: todo.urgency,
      expiration_date: todo.expirationDate ? toIso(todo.expirationDate) : null,
      content,
      content_format: 'blocknote',
      completed_at: todo.status === 'done' ? toIso(todo.updatedAt ?? todo.createdAt) : null,
      created_at: toIso(todo.createdAt),
      updated_at: toIso(todo.updatedAt ?? todo.createdAt),
    })
  }

  const tagRows: TagInsert[] = data.tags.map((tag) => ({
    id: stableUuid(`sisyflow:tag:${tag.id ?? `${tag.name}:${tag.projectId}`}`),
    user_id: userId,
    project_id: projectIdByLocalId.get(tag.projectId) ?? stableUuid(`sisyflow:project:${tag.projectId}`),
    name: tag.name,
    color_code: tag.color ?? null,
  }))

  return {
    rows: { epics: epicRows, projects: projectRows, todos: todoRows, tags: tagRows },
    report: {
      epics: epicRows.length,
      projects: projectRows.length,
      todos: todoRows.length,
      tags: tagRows.length,
      ambiguousProjects,
      contentConversions,
    },
  }
}

export async function upsertMigrationRows(
  rows: MigrationRows,
  onProgress?: (step: string) => void,
  ignoreDuplicates = true
): Promise<void> {
  const options = { onConflict: 'id', ignoreDuplicates }
  await upsertInChunks('Épicas', rows.epics, (chunk) => supabase.from('epics').upsert(chunk, options), onProgress)
  await upsertInChunks('Proyectos', rows.projects, (chunk) => supabase.from('projects').upsert(chunk, options), onProgress)
  await upsertInChunks('Tareas', rows.todos, (chunk) => supabase.from('todos').upsert(chunk, options), onProgress)
  await upsertInChunks('Tags', rows.tags, (chunk) => supabase.from('tags').upsert(chunk, options), onProgress)
}

export async function migrateLocalData(
  userId: string,
  onProgress?: (step: string) => void
): Promise<MigrationReport> {
  onProgress?.('Leyendo datos locales…')
  const data: LegacyData = {
    projects: await db.projects.toArray(),
    todos: await db.todos.toArray(),
    epics: await db.epics.toArray(),
    tags: await db.tags.toArray(),
  }

  const { rows, report } = await buildMigrationRows(data, userId)
  await upsertMigrationRows(rows, onProgress)
  setMigrationMarker()
  return report
}
