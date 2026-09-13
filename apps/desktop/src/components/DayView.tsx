import { useNavigate } from 'react-router-dom'
import { CalendarDays, CalendarClock } from 'lucide-react'
import { useDayTodos, type DayTodo } from '../hooks/useDayTodos'
import { PRIORITY_LABELS, STATUS_LABELS } from '../types'
import { Card } from './ui'

const PRIORITY_DOTS: Record<string, string> = {
  low: 'bg-mint-dark',
  medium: 'bg-butter-dark',
  high: 'bg-coral-dark',
  critical: 'bg-red-400',
}

export function DayView() {
  const navigate = useNavigate()
  const { todos, loading } = useDayTodos()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-butter/40 animate-pulse" />
          <span className="text-nintendo-muted text-sm">Cargando tareas del día...</span>
        </div>
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-nintendo-muted">
        <div className="w-24 h-24 rounded-3xl bg-mint/30 flex items-center justify-center">
          <CalendarDays className="w-10 h-10 text-nintendo-muted/50" />
        </div>
        <p className="text-sm">No hay tareas pendientes en proyectos activos</p>
        <p className="text-xs text-nintendo-muted/70">
          Las tareas de proyectos pausados o completados no aparecen acá.
        </p>
      </div>
    )
  }

  const groups = new Map<string, { name: string; color: string; epicName?: string; todos: DayTodo[] }>()
  for (const todo of todos) {
    const group = groups.get(todo.projectId) ?? {
      name: todo.projectName,
      color: todo.projectColor,
      epicName: todo.epicName,
      todos: [],
    }
    group.todos.push(todo)
    groups.set(todo.projectId, group)
  }
  const orderedGroups = [...groups.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name))

  return (
    <div className="flex flex-col gap-6">
      {orderedGroups.map(([projectId, group]) => (
        <div key={projectId} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color }} />
            <button
              onClick={() => navigate(`/project/${projectId}`)}
              className="text-sm font-bold text-nintendo-text hover:underline"
            >
              {group.name}
            </button>
            {group.epicName && (
              <span className="text-[10px] text-nintendo-muted bg-nintendo-bg px-2 py-0.5 rounded-full">
                {group.epicName}
              </span>
            )}
            <span className="text-[10px] text-nintendo-muted bg-nintendo-bg px-1.5 py-0.5 rounded-full">
              {group.todos.length}
            </span>
          </div>
          {group.todos.map((todo) => (
            <DayTaskRow key={todo.id} todo={todo} onOpen={() => navigate(`/project/${projectId}`)} />
          ))}
        </div>
      ))}
    </div>
  )
}

function DayTaskRow({ todo, onOpen }: { todo: DayTodo; onOpen: () => void }) {
  const isExpired = todo.expirationDate && new Date(todo.expirationDate) < new Date()
  const dueLabel = todo.expirationDate
    ? new Date(todo.expirationDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null

  return (
    <Card hoverable className="px-4 py-3 flex items-center gap-3" onClick={onOpen}>
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOTS[todo.priority]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-nintendo-text truncate">{todo.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[10px] text-nintendo-muted bg-nintendo-bg px-2 py-0.5 rounded-full">
            {STATUS_LABELS[todo.status]}
          </span>
          <span className="text-[10px] text-nintendo-muted">{PRIORITY_LABELS[todo.priority]}</span>
          {dueLabel && (
            <span
              className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                isExpired ? 'bg-coral/40 text-red-500' : 'text-nintendo-muted bg-nintendo-bg'
              }`}
            >
              <CalendarClock className="w-3 h-3" />
              {dueLabel}
            </span>
          )}
        </div>
      </div>
      <span className="text-[10px] text-nintendo-muted flex-shrink-0">{todo.projectName}</span>
    </Card>
  )
}
