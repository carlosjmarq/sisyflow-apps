import { isoWeekday } from '../lib/recurrence'
import { WEEKDAYS, type TodoRecurrence } from '../types'
import { Select } from './ui'

const SELECTOR_OPTIONS = [
  { value: 'none', label: 'Nunca' },
  { value: 'daily', label: 'Diaria' },
  { value: 'custom', label: 'Semanal' },
  { value: 'weekdays', label: 'Días hábiles (Lun–Vie)' },
  { value: 'monthly', label: 'Mensual' },
]

/**
 * Selector de repetición estilo Google Calendar: al elegir "Semanal" se
 * despliegan las casillas de los días (ADR-017). `weekly` es legacy y se
 * muestra como "Semanal".
 */
export function RecurrenceField({
  recurrence,
  days,
  onChange,
  labelBgClass = 'bg-surface',
}: {
  recurrence: TodoRecurrence
  days: number[]
  onChange: (recurrence: TodoRecurrence, days: number[]) => void
  labelBgClass?: string
}) {
  const selectValue = recurrence === 'weekly' ? 'custom' : recurrence
  const effectiveDays = days.length > 0 ? days : [isoWeekday(new Date())]

  const handleSelect = (value: string) => {
    const next = value as TodoRecurrence
    if (next === 'custom') onChange('custom', effectiveDays)
    else onChange(next, [])
  }

  const toggleDay = (day: number) => {
    const current = new Set(effectiveDays)
    if (current.has(day)) {
      if (current.size === 1) return
      current.delete(day)
    } else {
      current.add(day)
    }
    onChange('custom', [...current].sort((a, b) => a - b))
  }

  return (
    <div className="flex flex-col gap-3">
      <Select
        label="Repetición"
        labelBgClass={labelBgClass}
        options={SELECTOR_OPTIONS}
        value={selectValue}
        onChange={handleSelect}
      />
      {selectValue === 'custom' && (
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((weekday) => {
            const selected = effectiveDays.includes(weekday.value)
            return (
              <button
                key={weekday.value}
                type="button"
                title={weekday.label}
                aria-pressed={selected}
                onClick={() => toggleDay(weekday.value)}
                className={[
                  'state-layer h-10 w-10 rounded-full text-label-large font-medium transition-colors',
                  selected
                    ? 'bg-primary text-on-primary'
                    : 'border border-outline text-on-surface-variant hover:bg-on-surface/[0.08]',
                ].join(' ')}
              >
                {weekday.short}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
