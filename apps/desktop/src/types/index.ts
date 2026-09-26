export interface Epic {
  id: string
  name: string
  colorCode: string
  createdAt: Date
}

export type ProjectStatus = 'active' | 'paused' | 'completed'

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Activo',
  paused: 'Pausado',
  completed: 'Completado',
}

export interface Project {
  id: string
  epicId: string
  name: string
  color: string
  status: ProjectStatus
  createdAt: Date
  epic?: Pick<Epic, 'id' | 'name' | 'colorCode'>
  todoCount?: number
  doneCount?: number
}

export type TodoStatus = 'backlog' | 'todo' | 'in-progress' | 'done' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type Urgency = 'low' | 'medium' | 'high' | 'critical'
export type TodoRecurrence = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom'

export const RECURRENCE_LABELS: Record<TodoRecurrence, string> = {
  none: 'Nunca',
  daily: 'Diaria',
  weekdays: 'Días hábiles',
  weekly: 'Semanal',
  monthly: 'Mensual',
  custom: 'Personalizada',
}

export interface WeekdayOption {
  value: number
  short: string
  label: string
}

/** Días ISO: 1 = lunes … 7 = domingo (ADR-017). */
export const WEEKDAYS: WeekdayOption[] = [
  { value: 1, short: 'L', label: 'Lunes' },
  { value: 2, short: 'M', label: 'Martes' },
  { value: 3, short: 'X', label: 'Miércoles' },
  { value: 4, short: 'J', label: 'Jueves' },
  { value: 5, short: 'V', label: 'Viernes' },
  { value: 6, short: 'S', label: 'Sábado' },
  { value: 7, short: 'D', label: 'Domingo' },
]

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
  { value: 'violeta', label: 'Violeta', bg: '#6750A4' },
  { value: 'azul', label: 'Azul', bg: '#1E88E5' },
  { value: 'teal', label: 'Teal', bg: '#00897B' },
  { value: 'verde', label: 'Verde', bg: '#43A047' },
  { value: 'ambar', label: 'Ámbar', bg: '#FFB300' },
  { value: 'naranja', label: 'Naranja', bg: '#FB8C00' },
  { value: 'rojo', label: 'Rojo', bg: '#E53935' },
  { value: 'rosa', label: 'Rosa', bg: '#D81B60' },
  { value: 'purpura', label: 'Púrpura', bg: '#8E24AA' },
  { value: 'grafito', label: 'Grafito', bg: '#546E7A' },
] as const

export const DEFAULT_HEX = '#6750A4'

const LEGACY_PALETTE: Record<string, string> = {
  mint: '#C7F9CC',
  coral: '#FFC6D9',
  lavender: '#D8D5F9',
  peach: '#FFE5D9',
  sky: '#BDE0FE',
  butter: '#FFF9C4',
}

export function paletteHex(colorOrHex: string): string {
  return PROJECT_COLORS.find((c) => c.value === colorOrHex)?.bg ?? LEGACY_PALETTE[colorOrHex] ?? colorOrHex
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#81C995',
  medium: '#FDD663',
  high: '#FCAD70',
  critical: '#F28B82',
}

export interface Todo {
  id: string
  projectId: string
  title: string
  status: TodoStatus
  priority: Priority
  urgency: Urgency
  content: string
  contentFormat?: 'markdown' | 'blocknote'
  createdAt: Date
  updatedAt?: Date
  expirationDate: Date | null
  completedAt?: Date | null
  recurrence: TodoRecurrence
  /** Días ISO (1..7) cuando `recurrence === 'custom'` (ADR-017). */
  recurrenceDays?: number[]
}

export interface TodoCompletion {
  id: string
  todoId: string
  completedAt: Date
}

export type TagColor = string

export interface Tag {
  id: string
  projectId: string
  name: string
  color?: TagColor
}

export type TodoSortKey = 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'title' | 'expirationDate'
export type ProjectSortKey = 'createdAt' | 'name'

export const TODO_SORT_OPTIONS: { value: TodoSortKey; label: string }[] = [
  { value: 'createdAt', label: 'Fecha de creación' },
  { value: 'updatedAt', label: 'Última modificación' },
  { value: 'priority', label: 'Prioridad' },
  { value: 'status', label: 'Estado' },
  { value: 'title', label: 'Alfabético' },
  { value: 'expirationDate', label: 'Fecha de expiración' },
]

export const PROJECT_SORT_OPTIONS: { value: ProjectSortKey; label: string }[] = [
  { value: 'createdAt', label: 'Fecha de creación' },
  { value: 'name', label: 'Alfabético' },
]
