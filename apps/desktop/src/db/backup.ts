import { db } from './database'
import type { Project, Todo, Epic, Tag } from '../types'

interface BackupData {
  version: number
  exportedAt: string
  projects: Project[]
  todos: Todo[]
  epics: Epic[]
  tags?: Tag[]
}

export async function exportBackup() {
  const [projects, todos, epics, tags] = await Promise.all([
    db.projects.toArray(),
    db.todos.toArray(),
    db.epics.toArray(),
    db.tags.toArray(),
  ])

  const backup: BackupData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    projects,
    todos,
    epics,
    tags,
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sisyflow-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importBackup(file: File) {
  const text = await file.text()
  const backup: BackupData = JSON.parse(text)

  if (!Array.isArray(backup.projects) || !Array.isArray(backup.todos) || !Array.isArray(backup.epics)) {
    throw new Error('Formato de backup invalido')
  }

  const projects = backup.projects.map((p) => ({
    ...p,
    createdAt: new Date(p.createdAt),
  }))

  const todos = backup.todos.map((t) => ({
    ...t,
    createdAt: new Date(t.createdAt),
    updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
    expirationDate: t.expirationDate ? new Date(t.expirationDate) : null,
  }))

  const epics = backup.epics.map((e) => ({ ...e }))
  const tags = (backup.tags ?? []).map((t) => ({ ...t }))

  await db.transaction('rw', db.projects, db.todos, db.epics, db.tags, async () => {
    await db.projects.clear()
    await db.todos.clear()
    await db.epics.clear()
    await db.tags.clear()
    await db.projects.bulkAdd(projects)
    await db.todos.bulkAdd(todos as Todo[])
    await db.epics.bulkAdd(epics)
    await db.tags.bulkAdd(tags)
  })
}
