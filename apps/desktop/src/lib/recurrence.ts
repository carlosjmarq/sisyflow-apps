import { RECURRENCE_LABELS, type TodoRecurrence } from '../types'

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

/** Día ISO del calendario: 1 = lunes … 7 = domingo (ADR-017). */
export function isoWeekday(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1
}

/**
 * Inicio del período vigente en la zona horaria local del cliente:
 * día a las 00:00, semana el lunes y mes el día 1 (ADR-014). La recurrencia
 * personalizada (`custom`) se comporta como `weekdays`: período de un día.
 */
export function recurrencePeriodStart(recurrence: TodoRecurrence, now = new Date()): Date | null {
  switch (recurrence) {
    case 'daily':
    case 'weekdays':
    case 'custom':
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
    case 'custom':
      return 'hoy'
    case 'weekly':
      return 'esta semana'
    case 'monthly':
      return 'este mes'
    default:
      return ''
  }
}

/**
 * ¿La tarea recurrente "toca" ese día? `custom` solo en sus días y `weekdays`
 * de lunes a viernes; el resto no filtra (ADR-017).
 */
export function recurrenceDueOn(
  recurrence: TodoRecurrence,
  days: number[] | undefined,
  date = new Date(),
): boolean {
  switch (recurrence) {
    case 'weekdays':
      return isoWeekday(date) <= 5
    case 'custom':
      return (days ?? []).includes(isoWeekday(date))
    default:
      return true
  }
}

const WEEKDAY_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

/** Etiqueta legible: para `custom` incluye los días (ej. "Semanal (lun, mar)"). */
export function recurrenceSummary(
  recurrence: TodoRecurrence,
  days?: number[],
): string {
  if (recurrence === 'custom') {
    const list = [...new Set(days ?? [])].sort((a, b) => a - b)
    if (list.length === 0) return RECURRENCE_LABELS.custom
    return `Semanal (${list.map((day) => WEEKDAY_SHORT[day - 1]).join(', ')})`
  }
  return RECURRENCE_LABELS[recurrence]
}
