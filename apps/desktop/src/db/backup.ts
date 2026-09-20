import { supabase } from '../lib/supabase'
import type { LegacyData } from '../db/database'
import type { EpicInsert, ProjectInsert, TagInsert, TodoCompletionInsert, TodoInsert } from '../data/mappers'
import { buildMigrationRows, upsertInChunks } from '../migration/sisifo'

const BACKUP_VERSION = 4

interface BackupV4 {
  version: number
  exportedAt: string
  epics: unknown[]
  projects: unknown[]
  todos: unknown[]
  tags: unknown[]
  completions: unknown[]
}

export async function exportBackup(): Promise<void> {
  const [epics, projects, todos, tags, completions] = await Promise.all([
    supabase.from('epics').select('*'),
    supabase.from('projects').select('*'),
    supabase.from('todos').select('*'),
    supabase.from('tags').select('*'),
    supabase.from('todo_completions').select('*'),
  ])

  const error = epics.error ?? projects.error ?? todos.error ?? tags.error ?? completions.error
  if (error) throw new Error(`No se pudo exportar el backup: ${error.message}`)

  const backup: BackupV4 = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    epics: epics.data ?? [],
    projects: projects.data ?? [],
    todos: todos.data ?? [],
    tags: tags.data ?? [],
    completions: completions.data ?? [],
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sisyflow-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importBackup(
  file: File,
  userId: string,
  onProgress?: (step: string) => void
): Promise<void> {
  const parsed = JSON.parse(await file.text()) as {
    version?: number
    projects?: unknown
    todos?: unknown
    epics?: unknown
    tags?: unknown
    completions?: unknown
  }

  const withUser = <T extends { user_id?: string }>(rows: T[]): T[] =>
    rows.map((row) => ({ ...row, user_id: userId }))

  if (parsed.version === BACKUP_VERSION) {
    const epics = requireArray(parsed.epics, 'epics')
    const projects = requireArray(parsed.projects, 'projects')
    const todos = requireArray(parsed.todos, 'todos')
    const tags = requireArray(parsed.tags, 'tags')
    const completions = requireArray(parsed.completions, 'completions')

    const options = { onConflict: 'id', ignoreDuplicates: false }
    await upsertInChunks('Épicas', withUser(epics as EpicInsert[]), (c) => supabase.from('epics').upsert(c, options), onProgress)
    await upsertInChunks('Proyectos', withUser(projects as ProjectInsert[]), (c) => supabase.from('projects').upsert(c, options), onProgress)
    await upsertInChunks('Tareas', withUser(todos as TodoInsert[]), (c) => supabase.from('todos').upsert(c, options), onProgress)
    await upsertInChunks('Completados', withUser(completions as TodoCompletionInsert[]), (c) => supabase.from('todo_completions').upsert(c, options), onProgress)
    await upsertInChunks('Tags', withUser(tags as TagInsert[]), (c) => supabase.from('tags').upsert(c, options), onProgress)
    return
  }

  if (parsed.version === 3) {
    const epics = requireArray(parsed.epics, 'epics')
    const projects = requireArray(parsed.projects, 'projects')
    const todos = requireArray(parsed.todos, 'todos')
    const tags = requireArray(parsed.tags, 'tags')

    const options = { onConflict: 'id', ignoreDuplicates: false }
    await upsertInChunks('Épicas', withUser(epics as EpicInsert[]), (c) => supabase.from('epics').upsert(c, options), onProgress)
    await upsertInChunks('Proyectos', withUser(projects as ProjectInsert[]), (c) => supabase.from('projects').upsert(c, options), onProgress)
    await upsertInChunks('Tareas', withUser(todos as TodoInsert[]), (c) => supabase.from('todos').upsert(c, options), onProgress)
    await upsertInChunks('Tags', withUser(tags as TagInsert[]), (c) => supabase.from('tags').upsert(c, options), onProgress)
    return
  }

  if (Array.isArray(parsed.projects) && Array.isArray(parsed.todos) && Array.isArray(parsed.epics)) {
    const { rows } = await buildMigrationRows(parsed as LegacyData, userId)
    const options = { onConflict: 'id', ignoreDuplicates: true }
    await upsertInChunks('Épicas', rows.epics, (c) => supabase.from('epics').upsert(c, options), onProgress)
    await upsertInChunks('Proyectos', rows.projects, (c) => supabase.from('projects').upsert(c, options), onProgress)
    await upsertInChunks('Tareas', rows.todos, (c) => supabase.from('todos').upsert(c, options), onProgress)
    await upsertInChunks('Tags', rows.tags, (c) => supabase.from('tags').upsert(c, options), onProgress)
    return
  }

  throw new Error('Formato de backup inválido')
}

function requireArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`Backup inválido: falta el arreglo "${field}"`)
  return value
}
