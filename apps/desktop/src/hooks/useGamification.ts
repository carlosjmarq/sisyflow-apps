import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/ui/ToastContext'

export interface DailyLog {
  day: string
  epicId: string
  count: number
}

export interface EpicStreak {
  epicId: string
  current: number
  best: number
}

export interface GlobalStreak {
  current: number
  best: number
}

function clientTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/**
 * Logs diarios y rachas por épica (US 3.1–3.4). El corte del día y las rachas
 * se calculan en SQL con la zona horaria del cliente (ADR-011).
 */
export function useGamification(days = 365) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [streaks, setStreaks] = useState<EpicStreak[]>([])
  const [globalStreak, setGlobalStreak] = useState<GlobalStreak>({ current: 0, best: 0 })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const tz = clientTimeZone()
    const [logsRes, streaksRes, globalRes] = await Promise.all([
      supabase.rpc('daily_epic_logs_tz', { p_tz: tz, p_days: days }),
      supabase.rpc('epic_streaks', { p_tz: tz }),
      supabase.rpc('streak_global', { p_tz: tz }),
    ])

    if (logsRes.error || streaksRes.error || globalRes.error) {
      console.error(logsRes.error ?? streaksRes.error ?? globalRes.error)
      showToast('No se pudieron cargar las estadísticas')
      setLoading(false)
      return
    }

    setLogs((logsRes.data ?? []).map((row) => ({
      day: row.day,
      epicId: row.epic_id,
      count: row.completed_count ?? 0,
    })))
    setStreaks((streaksRes.data ?? []).map((row) => ({
      epicId: row.epic_id,
      current: row.current_streak ?? 0,
      best: row.best_streak ?? 0,
    })))
    const globalRow = (globalRes.data ?? [])[0]
    setGlobalStreak({
      current: globalRow?.current_streak ?? 0,
      best: globalRow?.best_streak ?? 0,
    })
    setLoading(false)
  }, [user, showToast, days])

  useEffect(() => {
    load()
  }, [load])

  return { logs, streaks, globalStreak, loading, reload: load }
}
