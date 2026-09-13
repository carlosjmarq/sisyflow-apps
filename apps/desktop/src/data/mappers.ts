import type { Database, Json } from '../types/supabase'
import { DEFAULT_HEX } from '../types'
import type { Epic, Priority, Project, ProjectStatus, Tag, TagColor, Todo, TodoStatus, Urgency } from '../types'

export type EpicRow = Database['public']['Tables']['epics']['Row']
export type ProjectRow = Database['public']['Tables']['projects']['Row']
export type TodoRow = Database['public']['Tables']['todos']['Row']
export type TagRow = Database['public']['Tables']['tags']['Row']

export type EpicInsert = Database['public']['Tables']['epics']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type TodoInsert = Database['public']['Tables']['todos']['Insert']
export type TagInsert = Database['public']['Tables']['tags']['Insert']

export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type TodoUpdate = Database['public']['Tables']['todos']['Update']

export interface ProjectWithDetailsRow extends ProjectRow {
  epics: Pick<EpicRow, 'id' | 'name' | 'color_code'> | null
  todos: { status: TodoStatus }[]
}

export function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

export function parseContent(content: string): Json {
  try {
    const parsed: unknown = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed as Json
    if (parsed && typeof parsed === 'object') return [parsed] as Json
  } catch {
    // contenido no-JSON (markdown legacy): se conserva como párrafo de texto
  }
  return [{ type: 'paragraph', content: [{ type: 'text', text: content }] }] as unknown as Json
}

export function mapEpic(row: EpicRow): Epic {
  return {
    id: row.id,
    name: row.name,
    colorCode: row.color_code,
    createdAt: new Date(row.created_at),
  }
}

export function mapProject(row: ProjectWithDetailsRow): Project {
  const todos = row.todos ?? []
  return {
    id: row.id,
    epicId: row.epic_id,
    name: row.name,
    color: row.color_code ?? DEFAULT_HEX,
    status: row.status as ProjectStatus,
    createdAt: new Date(row.created_at),
    epic: row.epics
      ? { id: row.epics.id, name: row.epics.name, colorCode: row.epics.color_code }
      : undefined,
    todoCount: todos.length,
    doneCount: todos.filter((t) => t.status === 'done').length,
  }
}

export function mapTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    status: row.status as TodoStatus,
    priority: row.priority as Priority,
    urgency: row.urgency as Urgency,
    content: JSON.stringify(row.content ?? []),
    contentFormat: row.content_format === 'markdown' ? 'markdown' : 'blocknote',
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    expirationDate: row.expiration_date ? new Date(row.expiration_date) : null,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
  }
}

export function mapTag(row: TagRow): Tag {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    color: (row.color_code ?? undefined) as TagColor | undefined,
  }
}

export type ProjectUpdatableFields = Partial<Pick<Project, 'name' | 'color' | 'epicId' | 'status'>>

export function projectUpdateFromDomain(updates: ProjectUpdatableFields): ProjectUpdate {
  const row: ProjectUpdate = {}
  if (updates.name !== undefined) row.name = updates.name
  if (updates.color !== undefined) row.color_code = updates.color
  if (updates.epicId !== undefined) row.epic_id = updates.epicId
  if (updates.status !== undefined) row.status = updates.status
  return row
}

export function todoInsertFromDomain(todo: Todo, userId: string): TodoInsert {
  return {
    id: todo.id,
    user_id: userId,
    project_id: todo.projectId,
    title: todo.title,
    status: todo.status,
    priority: todo.priority,
    urgency: todo.urgency,
    expiration_date: todo.expirationDate ? toIso(todo.expirationDate) : null,
    content: parseContent(todo.content),
    content_format: todo.contentFormat ?? 'blocknote',
    completed_at: todo.completedAt ? toIso(todo.completedAt) : null,
    created_at: toIso(todo.createdAt),
    updated_at: todo.updatedAt ? toIso(todo.updatedAt) : new Date().toISOString(),
  }
}

export function todoUpdateFromDomain(updates: Partial<Todo>): TodoUpdate {
  const row: TodoUpdate = { updated_at: new Date().toISOString() }
  if (updates.title !== undefined) row.title = updates.title
  if (updates.priority !== undefined) row.priority = updates.priority
  if (updates.urgency !== undefined) row.urgency = updates.urgency
  if (updates.expirationDate !== undefined) {
    row.expiration_date = updates.expirationDate ? toIso(updates.expirationDate) : null
  }
  if (updates.content !== undefined) row.content = parseContent(updates.content)
  if (updates.contentFormat !== undefined) row.content_format = updates.contentFormat
  if (updates.status !== undefined) {
    row.status = updates.status
    row.completed_at = updates.status === 'done' ? toIso(updates.completedAt ?? new Date()) : null
  }
  return row
}
