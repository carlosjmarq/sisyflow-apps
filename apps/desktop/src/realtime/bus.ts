import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/** Tablas del dominio replicadas en `supabase_realtime` (ADR-016). */
export const DB_TABLES = ['epics', 'projects', 'todos', 'tags', 'todo_completions'] as const
export type DbTable = (typeof DB_TABLES)[number]
export type DbEventType = 'INSERT' | 'UPDATE' | 'DELETE'

export interface DbChange {
  table: DbTable
  eventType: DbEventType
  newRecord: Record<string, unknown> | null
  oldRecord: Record<string, unknown> | null
  /** true cuando el bus se (re)suscribe y las vistas deben reconciliar. */
  resync: boolean
}

type ChangeHandler = (change: DbChange) => void

interface PostgresPayload {
  eventType: string
  new: unknown
  old: unknown
}

/**
 * Bus de Realtime con micro-suscripciones ref-counteadas: un único canal por
 * usuario que solo mantiene los bindings (tabla) que alguna vista necesita.
 * Al montar/desmontar vistas se recalcula el set de tablas (con debounce) y se
 * reconstruye el canal. Filtra SIEMPRE por `user_id` porque la RLS no aplica a
 * los DELETE (ver ADR-016).
 */
class RealtimeBus {
  private channel: RealtimeChannel | null = null
  private userId: string | null = null
  private readonly refs = new Map<DbTable, number>()
  private readonly handlers = new Map<DbTable, Set<ChangeHandler>>()
  private rebuildTimer: ReturnType<typeof setTimeout> | null = null

  start(userId: string): void {
    if (this.userId === userId && this.channel) return
    this.teardown()
    this.userId = userId
    this.scheduleRebuild(0)
  }

  stop(): void {
    this.userId = null
    this.refs.clear()
    this.handlers.clear()
    if (this.rebuildTimer) {
      clearTimeout(this.rebuildTimer)
      this.rebuildTimer = null
    }
    this.teardown()
  }

  watch(tables: readonly DbTable[], handler: ChangeHandler): () => void {
    const unique = [...new Set(tables)]
    for (const table of unique) {
      this.refs.set(table, (this.refs.get(table) ?? 0) + 1)
      const set = this.handlers.get(table) ?? new Set<ChangeHandler>()
      set.add(handler)
      this.handlers.set(table, set)
    }
    this.scheduleRebuild()

    let active = true
    return () => {
      if (!active) return
      active = false
      for (const table of unique) {
        const next = (this.refs.get(table) ?? 1) - 1
        if (next <= 0) this.refs.delete(table)
        else this.refs.set(table, next)
        this.handlers.get(table)?.delete(handler)
      }
      this.scheduleRebuild()
    }
  }

  private scheduleRebuild(delay = 50): void {
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer)
    this.rebuildTimer = setTimeout(() => {
      this.rebuildTimer = null
      this.rebuild()
    }, delay)
  }

  private rebuild(): void {
    this.teardown()
    if (!this.userId || this.refs.size === 0) return
    const userId = this.userId

    let channel = supabase.channel(`sisyflow:db:${userId}`)
    for (const table of this.refs.keys()) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
        (payload) => this.dispatch(table, payload),
      )
    }
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') this.resync()
    })
    this.channel = channel
  }

  private dispatch(table: DbTable, payload: PostgresPayload): void {
    const { eventType } = payload
    if (eventType !== 'INSERT' && eventType !== 'UPDATE' && eventType !== 'DELETE') return
    const change: DbChange = {
      table,
      eventType,
      newRecord: (payload.new as Record<string, unknown> | null) ?? null,
      oldRecord: (payload.old as Record<string, unknown> | null) ?? null,
      resync: false,
    }
    for (const handler of this.handlers.get(table) ?? []) handler(change)
  }

  private resync(): void {
    for (const [table, set] of this.handlers) {
      for (const handler of set) {
        handler({ table, eventType: 'UPDATE', newRecord: null, oldRecord: null, resync: true })
      }
    }
  }

  private teardown(): void {
    if (this.channel) {
      void supabase.removeChannel(this.channel)
      this.channel = null
    }
  }
}

export const realtimeBus = new RealtimeBus()
