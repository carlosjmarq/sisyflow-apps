import { z } from 'zod'
import { fail } from './errors.js'

export const projectStatusSchema = z.enum(['active', 'paused', 'completed'])
export const todoStatusSchema = z.enum(['backlog', 'todo', 'in-progress', 'done', 'cancelled'])
export const prioritySchema = z.enum(['low', 'medium', 'high', 'critical'])
export const urgencySchema = z.enum(['low', 'medium', 'high', 'critical'])
export const contentFormatSchema = z.enum(['blocknote', 'markdown'])

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