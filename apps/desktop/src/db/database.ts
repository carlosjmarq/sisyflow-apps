import Dexie, { type Table } from 'dexie'
import type { Project, Todo, Epic, Tag } from '../types'

class TodoDatabase extends Dexie {
  projects!: Table<Project, number>
  todos!: Table<Todo, number>
  epics!: Table<Epic, number>
  tags!: Table<Tag, number>

  constructor() {
    super('TodoDexDB')

    this.version(2).stores({
      projects: '++id, name, createdAt',
      todos: '++id, projectId, status, priority, urgency, createdAt, expirationDate',
      epics: '++id, projectId, name',
    })

    this.version(3).stores({
      tags: '++id, projectId, name',
    })

    this.version(4).stores({
      todos: '++id, projectId, status, priority, urgency, createdAt, updatedAt, expirationDate',
    })
  }
}

export const db = new TodoDatabase()
