import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { DailyLog } from '../hooks/useGamification'

const OPACITY = [0, 0.35, 0.55, 0.75, 1]
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DAY_LABELS = ['Lun', '', 'Mié', '', 'Vie', '', '']

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface HeatmapProps {
  logs: DailyLog[]
  baseColor?: string
  days?: number
}

export function Heatmap({ logs, baseColor = 'rgb(var(--md-primary))', days = 126 }: HeatmapProps) {
  const { weeks, monthLabels, countByDay, maxCount, today } = useMemo(() => {
    const counts = new Map<string, number>()
    let max = 0
    for (const log of logs) {
      const next = (counts.get(log.day) ?? 0) + log.count
      counts.set(log.day, next)
      if (next > max) max = next
    }

    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    const totalDays = Math.max(days, 7)
    const start = new Date(todayDate)
    start.setDate(start.getDate() - (totalDays - 1))
    const startDow = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - startDow)

    const builtWeeks: Date[][] = []
    const labels: (string | null)[] = []
    let lastMonth = -1
    const cursor = new Date(start)
    while (cursor.getTime() <= todayDate.getTime()) {
      const week: Date[] = []
      for (let index = 0; index < 7; index++) {
        week.push(new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
      builtWeeks.push(week)
      const month = week[0].getMonth()
      labels.push(month !== lastMonth ? MONTHS[month] : null)
      lastMonth = month
    }

    return { weeks: builtWeeks, monthLabels: labels, countByDay: counts, maxCount: max, today: todayDate }
  }, [logs, days])

  const level = (count: number): number => {
    if (count <= 0 || maxCount <= 0) return 0
    const ratio = count / maxCount
    if (ratio <= 0.25) return 1
    if (ratio <= 0.5) return 2
    if (ratio <= 0.75) return 3
    return 4
  }

  return (
    <motion.div
      key={`${days}-${baseColor}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.05, 0.7, 0.1, 1] }}
      className="flex min-w-max flex-col gap-2 selectable"
    >
      <div className="ml-8 flex gap-[3px]">
        {monthLabels.map((label, index) => (
          <div key={index} className="w-3.5 overflow-visible whitespace-nowrap text-[11px] leading-4 text-on-surface-variant">
            {label ?? ''}
          </div>
        ))}
      </div>

      <div className="flex gap-[3px]">
        <div className="mr-1 flex w-6 flex-col gap-[3px] text-[11px] text-on-surface-variant">
          {DAY_LABELS.map((label, index) => (
            <span key={index} className="h-3.5">{label}</span>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[3px]">
            {week.map((date) => {
              const key = toDateKey(date)
              const count = countByDay.get(key) ?? 0
              const cellLevel = level(count)
              const isFuture = date.getTime() > today.getTime()
              const title = `${date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}: ${count} completada${count === 1 ? '' : 's'}`
              return (
                <div
                  key={key}
                  title={isFuture ? undefined : title}
                  className={`h-3.5 w-3.5 rounded-[4px] ${
                    isFuture ? 'opacity-0' : cellLevel === 0 ? 'bg-on-surface/[0.08]' : ''
                  }`}
                  style={
                    !isFuture && cellLevel > 0
                      ? { backgroundColor: baseColor, opacity: OPACITY[cellLevel] }
                      : undefined
                  }
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="ml-8 flex items-center gap-1.5 text-label-small text-on-surface-variant">
        <span>Menos</span>
        {[0, 1, 2, 3, 4].map((value) => (
          <span
            key={value}
            className={`h-3.5 w-3.5 rounded-[4px] ${value === 0 ? 'bg-on-surface/[0.08]' : ''}`}
            style={value > 0 ? { backgroundColor: baseColor, opacity: OPACITY[value] } : undefined}
          />
        ))}
        <span>Más</span>
      </div>
    </motion.div>
  )
}
