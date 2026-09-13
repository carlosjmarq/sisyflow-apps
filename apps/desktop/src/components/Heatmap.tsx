import { useMemo } from 'react'
import type { DailyLog } from '../hooks/useGamification'

const TOTAL_DAYS = 365
const OPACITY = [0, 0.35, 0.55, 0.75, 1]
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function Heatmap({ logs, baseColor }: { logs: DailyLog[]; baseColor: string }) {
  const { weeks, monthLabels, countByDay, maxCount, today } = useMemo(() => {
    const counts = new Map<string, number>()
    let max = 0
    for (const log of logs) {
      const next = (counts.get(log.day) ?? 0) + log.count
      counts.set(log.day, next)
      if (next > max) max = next
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(today)
    start.setDate(start.getDate() - (TOTAL_DAYS - 1))
    const startDow = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - startDow)

    const dates: Date[] = []
    const cursor = new Date(start)
    while (dates.length < 54 * 7) {
      dates.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }

    const builtWeeks: Date[][] = []
    const labels: (string | null)[] = []
    let lastMonth = -1
    for (let w = 0; w < 54; w++) {
      const week = dates.slice(w * 7, w * 7 + 7)
      if (week.length < 7) break
      if (week[0].getTime() > today.getTime()) break
      builtWeeks.push(week)
      const month = week[0].getMonth()
      labels.push(month !== lastMonth ? MONTHS[month] : null)
      lastMonth = month
    }

    return { weeks: builtWeeks, monthLabels: labels, countByDay: counts, maxCount: max, today }
  }, [logs])

  const level = (count: number): number => {
    if (count <= 0 || maxCount <= 0) return 0
    const ratio = count / maxCount
    if (ratio <= 0.25) return 1
    if (ratio <= 0.5) return 2
    if (ratio <= 0.75) return 3
    return 4
  }

  return (
    <div className="flex flex-col gap-2 min-w-max">
      <div className="flex gap-[3px] ml-8">
        {monthLabels.map((label, index) => (
          <div key={index} className="w-3 text-[9px] text-nintendo-muted whitespace-nowrap">
            {label ?? ''}
          </div>
        ))}
      </div>

      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] mr-1 text-[9px] leading-3 text-nintendo-muted w-6">
          {['Lun', '', 'Mié', '', 'Vie', '', ''].map((label, index) => (
            <span key={index} className="h-3">{label}</span>
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
                  className={`w-3 h-3 rounded-[3px] ${
                    isFuture ? 'opacity-0' : cellLevel === 0 ? 'bg-nintendo-border/50' : ''
                  }`}
                  style={!isFuture && cellLevel > 0 ? { backgroundColor: baseColor, opacity: OPACITY[cellLevel] } : undefined}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-nintendo-muted ml-8">
        <span>Menos</span>
        {[0, 1, 2, 3, 4].map((value) => (
          <span
            key={value}
            className={`w-3 h-3 rounded-[3px] ${value === 0 ? 'bg-nintendo-border/50' : ''}`}
            style={value > 0 ? { backgroundColor: baseColor, opacity: OPACITY[value] } : undefined}
          />
        ))}
        <span>Más</span>
      </div>
    </div>
  )
}
