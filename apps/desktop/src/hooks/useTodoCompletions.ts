import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/ui/ToastContext'
import { mapTodoCompletion, todoCompletionInsertFromDomain, type TodoCompletionRow } from '../data/mappers'
import { recurrencePeriodStart } from '../lib/recurrence'
import { useRealtimeRefresh } from '../realtime/useRealtimeRefresh'
import type { Todo, TodoCompletion } from '../types'

const HISTORY_LOOKBACK_MS = 62 * 24 * 60 * 60 * 1000

export interface TodoCompletionState {
  count: number
  lastCompletedAt: Date | null
  periodItems: TodoCompletion[]
  items: TodoCompletion[]
}

/**
 * Historial de completados de tareas recurrentes (US 4.1, ADR-014).
 * Carga los completados de los últimos ~2 meses y calcula, por tarea, el
 * contador del período vigente en la zona horaria local del cliente.
 */
export function useTodoCompletions(todos: Todo[]) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [completions, setCompletions] = useState<TodoCompletion[]>([])

  const idsKey = useMemo(() => todos.map((todo) => todo.id).sort().join(','), [todos])
  const recurrenceByTodo = useMemo(
    () => new Map(todos.map((todo) => [todo.id, todo.recurrence])),
    [todos],
  )

  const load = useCallback(async () => {
    if (!user || !idsKey) {
      setCompletions([])
      return
    }
    const ids = idsKey.split(',')
    const since = new Date(Date.now() - HISTORY_LOOKBACK_MS).toISOString()
    const { data, error } = await supabase
      .from('todo_completions')
      .select('*')
      .in('todo_id', ids)
      .gte('completed_at', since)
      .order('completed_at', { ascending: false })

    if (error) {
      console.error(error)
      showToast('No se pudieron cargar los completados')
      return
    }
    setCompletions(((data ?? []) as TodoCompletionRow[]).map(mapTodoCompletion))
  }, [user, idsKey, showToast])

  useEffect(() => {
    load()
  }, [load])

  useRealtimeRefresh(['todo_completions'], load, { enabled: Boolean(user && idsKey) })

  const complete = useCallback(async (todoId: string, completedAt = new Date()) => {
    if (!user) return null
    const completion: TodoCompletion = { id: crypto.randomUUID(), todoId, completedAt }
    setCompletions((prev) => [completion, ...prev])

    const { error } = await supabase
      .from('todo_completions')
      .insert(todoCompletionInsertFromDomain(completion, user.id))

    if (error) {
      console.error(error)
      setCompletions((prev) => prev.filter((item) => item.id !== completion.id))
      showToast('No se pudo registrar el completado')
      return null
    }
    return completion.id
  }, [user, showToast])

  const remove = useCallback(async (completionId: string) => {
    const previous = completions
    setCompletions((prev) => prev.filter((item) => item.id !== completionId))

    const { error } = await supabase.from('todo_completions').delete().eq('id', completionId)
    if (error) {
      console.error(error)
      setCompletions(previous)
      showToast('No se pudo deshacer el completado')
      return false
    }
    return true
  }, [completions, showToast])

  const undoLast = useCallback(async (todoId: string) => {
    const last = completions.find((item) => item.todoId === todoId)
    if (!last) return
    await remove(last.id)
  }, [completions, remove])

  const byTodo = useMemo(() => {
    const map = new Map<string, TodoCompletion[]>()
    for (const completion of completions) {
      const list = map.get(completion.todoId) ?? []
      list.push(completion)
      map.set(completion.todoId, list)
    }
    return map
  }, [completions])

  const forTodo = useCallback(
    (todoId: string): TodoCompletionState => {
      const items = byTodo.get(todoId) ?? []
      const recurrence = recurrenceByTodo.get(todoId) ?? 'none'
      const periodStart = recurrencePeriodStart(recurrence)
      const periodItems = periodStart
        ? items.filter((item) => item.completedAt >= periodStart)
        : []
      return {
        count: periodItems.length,
        lastCompletedAt: items[0]?.completedAt ?? null,
        periodItems,
        items,
      }
    },
    [byTodo, recurrenceByTodo],
  )

  return { completions, byTodo, forTodo, complete, remove, undoLast, reload: load }
}
