import { useEffect, useRef } from 'react'
import { realtimeBus, type DbTable } from './bus'

interface RealtimeRefreshOptions {
  /** Coalesce ráfagas de eventos (ms). */
  debounceMs?: number
  /** Permite desactivar la suscripción (p. ej. sin usuario o sin datos). */
  enabled?: boolean
}

/**
 * Suscribe la vista a las tablas indicadas y recarga (con debounce) ante
 * cualquier cambio o resync. Pensado para micro-suscripciones: solo las tablas
 * que la vista realmente lee y solo mientras está montada.
 */
export function useRealtimeRefresh(
  tables: DbTable[],
  reload: () => void,
  options: RealtimeRefreshOptions = {},
): void {
  const { debounceMs = 250, enabled = true } = options
  const reloadRef = useRef(reload)
  reloadRef.current = reload
  const key = tables.join(',')

  useEffect(() => {
    if (!enabled || !key) return
    let timer: ReturnType<typeof setTimeout> | null = null

    const schedule = (): void => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        reloadRef.current()
      }, debounceMs)
    }

    const unsubscribe = realtimeBus.watch(key.split(',') as DbTable[], schedule)
    return () => {
      unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [key, enabled, debounceMs])
}
