import Dexie, { type Table } from 'dexie'
import type { Priority, TodoStatus, Urgency } from '../types'

/**
 * Tipos del esquema Dexie heredado de TodoDex. Solo se usan como origen de la
 * migración Sísifo (US 1.2, ADR-008/ADR-009); la app ya no escribe aquí.
 */

export interface LegacyProject {
  id?: number
  name: string
  color: string
  createdAt: Date
}

export interface LegacyTodo {
  id?: number
  projectId: number
  title: string
  status: TodoStatus
  priority: Priority
  urgency: Urgency
  epic: string
  content: string
  contentFormat?: 'markdown' | 'blocknote'
  createdAt: Date
  updatedAt?: Date
  expirationDate: Date | null
}

export interface LegacyEpic {
  id?: number
  projectId: number
  name: string
}

export interface LegacyTag {
  id?: number
  projectId: number
  name: string
  color?: string
}

class TodoDatabase extends Dexie {
  projects!: Table<LegacyProject, number>
  todos!: Table<LegacyTodo, number>
  epics!: Table<LegacyEpic, number>
  tags!: Table<LegacyTag, number>

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

export interface LegacyData {
  projects: LegacyProject[]
  todos: LegacyTodo[]
  epics: LegacyEpic[]
  tags: LegacyTag[]
}
