import { z } from 'zod'
import { fail } from './errors.js'

export const projectStatusSchema = z.enum(['active', 'paused', 'completed'])
export const todoStatusSchema = z.enum(['backlog', 'todo', 'in-progress', 'done', 'cancelled'])
export const prioritySchema = z.enum(['low', 'medium', 'high', 'critical'])
export const urgencySchema = z.enum(['low', 'medium', 'high', 'critical'])
export const contentFormatSchema = z.enum(['blocknote', 'markdown'])
export const recurrenceSchema = z.enum(['none', 'daily', 'weekdays', 'weekly', 'monthly', 'custom'])

export function parseTodoStatus(value: string): 'backlog' | 'todo' | 'in-progress' | 'done' | 'cancelled' {
  const parsed = todoStatusSchema.safeParse(value)
  if (!parsed.success) fail(`Estado inválido "${value}". Válidos: ${todoStatusSchema.options.join(', ')}`, 2)
  return parsed.data
}

export function parseProjectStatus(value: string): 'active' | 'paused' | 'completed' {
  const parsed = projectStatusSchema.safeParse(value)
  if (!parsed.success) fail(`Estado inválido "${value}". Válidos: ${projectStatusSchema.options.join(', ')}`, 2)
  return parsed.data
}

export function parsePriority(value: string): 'low' | 'medium' | 'high' | 'critical' {
  const parsed = prioritySchema.safeParse(value)
  if (!parsed.success) fail(`Prioridad inválida "${value}". Válidas: ${prioritySchema.options.join(', ')}`, 2)
  return parsed.data
}

export function parseUrgency(value: string): 'low' | 'medium' | 'high' | 'critical' {
  const parsed = urgencySchema.safeParse(value)
  if (!parsed.success) fail(`Urgencia inválida "${value}". Válidas: ${urgencySchema.options.join(', ')}`, 2)
  return parsed.data
}

export function parseContentFormat(value: string): 'blocknote' | 'markdown' {
  const parsed = contentFormatSchema.safeParse(value)
  if (!parsed.success) fail(`Formato inválido "${value}". Válidos: blocknote, markdown`, 2)
  return parsed.data
}

export function parseRecurrence(
  value: string,
): 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom' {
  const parsed = recurrenceSchema.safeParse(value)
  if (!parsed.success) fail(`Recurrencia inválida "${value}". Válidas: ${recurrenceSchema.options.join(', ')}`, 2)
  return parsed.data
}

const WEEKDAY_NAMES: Record<string, number> = {
  lun: 1,
  lunes: 1,
  mar: 2,
  martes: 2,
  mie: 3,
  miercoles: 3,
  'mié': 3,
  'miércoles': 3,
  jue: 4,
  jueves: 4,
  vie: 5,
  viernes: 5,
  sab: 6,
  sabado: 6,
  'sáb': 6,
  'sábado': 6,
  dom: 7,
  domingo: 7,
}

/** Días ISO (1..7) desde `lun,mar` o `1,2` (ADR-017). */
export function parseWeekdays(value: string): number[] {
  const parts = value
    .split(/[\s,]+/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part !== '')
  if (parts.length === 0) fail('--days requiere al menos un día (ej. lun,mar)', 2)

  const days = new Set<number>()
  for (const part of parts) {
    const numeric = Number(part)
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 7) {
      days.add(numeric)
      continue
    }
    const named = WEEKDAY_NAMES[part]
    if (named) {
      days.add(named)
      continue
    }
    fail(`Día inválido "${part}". Usa lun..dom o 1..7`, 2)
  }
  return [...days].sort((a, b) => a - b)
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export function parseDate(value: string): string {
  if (DATE_ONLY.test(value)) {
    const date = new Date(`${value}T00:00:00`)
    if (Number.isNaN(date.getTime())) fail(`Fecha inválida "${value}"`, 2)
    return date.toISOString()
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) fail(`Fecha inválida "${value}" (usa YYYY-MM-DD o ISO 8601)`, 2)
  return date.toISOString()
}

export function parseColor(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) fail('El color no puede estar vacío', 2)
  return trimmed
}