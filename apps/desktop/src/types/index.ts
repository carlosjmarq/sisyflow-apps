export interface Project {
  id?: number
  name: string
  color: string
  createdAt: Date
}

export type TodoStatus = 'backlog' | 'todo' | 'in-progress' | 'done' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type Urgency = 'low' | 'medium' | 'high' | 'critical'

export const STATUS_LABELS: Record<TodoStatus, string> = {
  backlog: 'Backlog',
  todo: 'Por hacer',
  'in-progress': 'En progreso',
  done: 'Completado',
  cancelled: 'Cancelado',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

export const URGENCY_LABELS: Record<Urgency, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

export const PROJECT_COLORS = [
  { value: 'mint', label: 'Mint', bg: '#C7F9CC', ring: 'ring-mint-dark' },
  { value: 'coral', label: 'Coral', bg: '#FFC6D9', ring: 'ring-coral-dark' },
  { value: 'lavender', label: 'Lavanda', bg: '#D8D5F9', ring: 'ring-lavender-dark' },
  { value: 'peach', label: 'Durazno', bg: '#FFE5D9', ring: 'ring-peach-dark' },
  { value: 'sky', label: 'Cielo', bg: '#BDE0FE', ring: 'ring-sky-dark' },
  { value: 'butter', label: 'Mantequilla', bg: '#FFF9C4', ring: 'ring-butters-dark' },
] as const

export interface Todo {
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

export interface Epic {
  id?: number
  projectId: number
  name: string
}

export type TagColor = typeof PROJECT_COLORS[number]['value']

export interface Tag {
  id?: number
  projectId: number
  name: string
  color?: TagColor
}

export type TodoSortKey = 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'title' | 'expirationDate'
export type ProjectSortKey = 'createdAt' | 'name'

export const TODO_SORT_OPTIONS: { value: TodoSortKey; label: string }[] = [
  { value: 'createdAt', label: 'Fecha de creacion' },
  { value: 'updatedAt', label: 'Ultima modificacion' },
  { value: 'priority', label: 'Prioridad' },
  { value: 'status', label: 'Estado' },
  { value: 'title', label: 'Alfabetico' },
  { value: 'expirationDate', label: 'Fecha de expiracion' },
]

export const PROJECT_SORT_OPTIONS: { value: ProjectSortKey; label: string }[] = [
  { value: 'createdAt', label: 'Fecha de creacion' },
  { value: 'name', label: 'Alfabetico' },
]
