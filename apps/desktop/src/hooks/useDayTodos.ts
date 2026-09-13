import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/ui/ToastContext'
import { mapTodo, type TodoRow } from '../data/mappers'
import type { Todo } from '../types'

export interface DayTodo extends Todo {
  projectName: string
  projectColor: string
  epicName?: string
}

interface DayTodoRow extends TodoRow {
  projects: {
    name: string
    color_code: string | null
    epics: { name: string } | null
  } | null
}

const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

function sortDayTodos(todos: DayTodo[]): DayTodo[] {
  return [...todos].sort((a, b) => {
    const aExp = a.expirationDate ? new Date(a.expirationDate).getTime() : Number.POSITIVE_INFINITY
    const bExp = b.expirationDate ? new Date(b.expirationDate).getTime() : Number.POSITIVE_INFINITY
    if (aExp !== bExp) return aExp - bExp
    const byPriority = (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0)
    if (byPriority !== 0) return byPriority
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

/**
 * Tareas pendientes de proyectos activos, agrupables por proyecto (US 2.2).
 * Los proyectos pausados/completados quedan fuera del día a día (ADR-010).
 */
export function useDayTodos() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [todos, setTodos] = useState<DayTodo[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('todos')
      .select('*, projects!inner(name, color_code, epics(name))')
      .not('status', 'in', '(done,cancelled)')
      .eq('projects.status', 'active')

    if (error) {
      console.error(error)
      showToast('No se pudieron cargar las tareas del día')
      setLoading(false)
      return
    }

    const mapped = ((data ?? []) as unknown as DayTodoRow[]).map((row) => ({
      ...mapTodo(row),
      projectName: row.projects?.name ?? 'Proyecto',
      projectColor: row.projects?.color_code ?? '#C7F9CC',
      epicName: row.projects?.epics?.name,
    }))
    setTodos(sortDayTodos(mapped))
    setLoading(false)
  }, [user, showToast])

  useEffect(() => {
    load()
  }, [load])

  return { todos, loading, reload: load }
}
