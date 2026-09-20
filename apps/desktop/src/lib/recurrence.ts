import type { TodoRecurrence } from '../types'

export function isRecurring(recurrence: TodoRecurrence | null | undefined): boolean {
  return recurrence != null && recurrence !== 'none'
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfWeek(date: Date): Date {
  const day = startOfDay(date)
  const diff = (day.getDay() + 6) % 7
  day.setDate(day.getDate() - diff)
  return day
}

/**
 * Inicio del período vigente en la zona horaria local del cliente:
 * día a las 00:00, semana el lunes y mes el día 1 (ADR-014).
 */
export function recurrencePeriodStart(recurrence: TodoRecurrence, now = new Date()): Date | null {
  switch (recurrence) {
    case 'daily':
    case 'weekdays':
      return startOfDay(now)
    case 'weekly':
      return startOfWeek(now)
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    default:
      return null
  }
}

export function recurrencePeriodLabel(recurrence: TodoRecurrence): string {
  switch (recurrence) {
    case 'daily':
    case 'weekdays':
      return 'hoy'
    case 'weekly':
      return 'esta semana'
    case 'monthly':
      return 'este mes'
    default:
      return ''
  }
}
