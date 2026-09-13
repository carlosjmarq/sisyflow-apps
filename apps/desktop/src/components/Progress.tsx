import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Flame } from 'lucide-react'
import { useGamification } from '../hooks/useGamification'
import { useEpics } from '../hooks/useProjects'
import { Card, Select } from './ui'
import { Heatmap } from './Heatmap'

export function Progress() {
  const navigate = useNavigate()
  const { logs, streaks, loading } = useGamification()
  const { epics } = useEpics()
  const [epicFilter, setEpicFilter] = useState('all')

  const selectedEpic = epics.find((e) => e.id === epicFilter)
  const baseColor = selectedEpic?.colorCode ?? '#9ED8A3'

  const visibleLogs = useMemo(
    () => (epicFilter === 'all' ? logs : logs.filter((log) => log.epicId === epicFilter)),
    [logs, epicFilter]
  )

  const sortedEpics = useMemo(() => {
    const currentFor = (epicId: string) => streaks.find((s) => s.epicId === epicId)?.current ?? 0
    return [...epics].sort((a, b) => currentFor(b.id) - currentFor(a.id) || a.name.localeCompare(b.name))
  }, [epics, streaks])

  return (
    <div className="h-full flex flex-col overflow-auto">
      <header className="px-8 py-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl hover:bg-white/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-nintendo-text/60" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-nintendo-text">Progreso</h1>
          <p className="text-sm text-nintendo-muted">Últimos 365 días y rachas por épica</p>
        </div>
      </header>

      <div className="px-8 pb-8 flex flex-col gap-6">
        <Card hoverable={false} className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-bold text-nintendo-text">Mapa de calor</h2>
            <Select
              options={[
                { value: 'all', label: 'Vista global' },
                ...epics.map((epic) => ({ value: epic.id, label: epic.name })),
              ]}
              value={epicFilter}
              onChange={setEpicFilter}
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-12 h-12 rounded-2xl bg-mint/40 animate-pulse" />
            </div>
          ) : (
            <div className="overflow-x-auto pb-1">
              <Heatmap logs={visibleLogs} baseColor={baseColor} />
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-3">
          <h2 className="font-bold text-nintendo-text">Rachas por épica</h2>
          {epics.length === 0 ? (
            <p className="text-sm text-nintendo-muted">Todavía no hay épicas.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedEpics.map((epic) => {
                const streak = streaks.find((s) => s.epicId === epic.id)
                return (
                  <Card key={epic.id} hoverable={false} className="p-4 flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: epic.colorCode }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-nintendo-text truncate">{epic.name}</p>
                      <p className="text-xs text-nintendo-muted">
                        Mejor marca: {streak?.best ?? 0} día{(streak?.best ?? 0) === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-coral-dark">
                      <Flame className="w-5 h-5" />
                      <span className="text-lg font-bold">{streak?.current ?? 0}</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
