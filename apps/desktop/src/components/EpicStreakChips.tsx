import { Chip, Icon, Skeleton } from './ui'
import type { EpicStreak } from '../hooks/useGamification'
import type { Epic } from '../types'

interface EpicStreakChipsProps {
  streaks: EpicStreak[]
  epics: Epic[]
  selectedScope: string
  onSelect: (scope: string) => void
  loading?: boolean
}

export function EpicStreakChips({
  streaks,
  epics,
  selectedScope,
  onSelect,
  loading = false,
}: EpicStreakChipsProps) {
  if (loading) {
    return (
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-36 rounded-sm" />
        ))}
      </div>
    )
  }

  if (epics.length === 0) return null

  const streakByEpic = new Map(streaks.map((streak) => [streak.epicId, streak]))

  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
      {epics.map((epic) => {
        const streak = streakByEpic.get(epic.id)
        const selected = selectedScope === epic.id
        return (
          <Chip
            key={epic.id}
            variant="filter"
            selected={selected}
            onClick={() => onSelect(selected ? 'global' : epic.id)}
            className="pl-2.5"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: epic.colorCode }}
            />
            <span className="max-w-[140px] truncate">{epic.name}</span>
            <span aria-hidden="true" className="text-on-surface-variant/50">
              ·
            </span>
            <span
              className={`inline-flex items-center gap-1 tabular-nums ${
                selected ? '' : 'text-on-surface'
              }`}
            >
              <Icon name="local_fire_department" size={16} filled />
              {streak?.current ?? 0}
            </span>
            <span aria-hidden="true" className="text-on-surface-variant/50">
              ·
            </span>
            <span className="text-on-surface-variant">mejor {streak?.best ?? 0}</span>
          </Chip>
        )
      })}
    </div>
  )
}
