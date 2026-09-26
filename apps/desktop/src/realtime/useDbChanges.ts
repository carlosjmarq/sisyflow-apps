import { useEffect, useRef } from 'react'
import { realtimeBus, type DbChange, type DbTable } from './bus'

/**
 * Se suscribe a los cambios de las tablas indicadas mientras el componente
 * esté montado. El `handler` se invoca en cada evento y en el resync por
 * reconexión.
 */
export function useDbChanges(tables: DbTable[], handler: (change: DbChange) => void): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  const key = tables.join(',')

  useEffect(() => {
    if (!key) return
    const list = key.split(',') as DbTable[]
    return realtimeBus.watch(list, (change) => handlerRef.current(change))
  }, [key])
}
