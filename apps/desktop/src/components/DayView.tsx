import { useNavigate } from 'react-router-dom'
import { useDayTodos, type DayTodo } from '../hooks/useDayTodos'
import type { TodoCompletionState } from '../hooks/useTodoCompletions'
import { isRecurring, recurrencePeriodLabel, recurrenceSummary } from '../lib/recurrence'
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS } from '../types'
import { Card, Icon, IconButton, Skeleton } from './ui'

export function DayView({ onActivity }: { onActivity?: () => void }) {
  const navigate = useNavigate()
  const { todos, loading, completionsForTodo, completeTodo, undoLastCompletion } = useDayTodos()

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-md" />
        ))}
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <Card variant="outlined" className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <Icon name="calendar_month" size={40} className="text-on-surface-variant/60" />
        <p className="text-body-medium text-on-surface">No hay tareas pendientes en proyectos activos</p>
        <p className="text-body-small text-on-surface-variant">
          Las tareas de proyectos pausados o completados no aparecen acá.
        </p>
      </Card>
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
        <div key={projectId} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
            <button
              onClick={() => navigate(`/project/${projectId}`)}
              className="text-title-small text-on-surface transition-colors hover:text-primary"
            >
              {group.name}
            </button>
            {group.epicName && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-small text-on-surface-variant">
                {group.epicName}
              </span>
            )}
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-small text-on-surface-variant">
              {group.todos.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {group.todos.map((todo) => (
              <DayTaskRow
                key={todo.id}
                todo={todo}
                completion={completionsForTodo(todo.id)}
                onOpen={() => navigate(`/project/${projectId}`, { state: { openTodoId: todo.id } })}
                onComplete={() => {
                  void completeTodo(todo.id).then((id) => {
                    if (id) onActivity?.()
                  })
                }}
                onUndo={() => {
                  void undoLastCompletion(todo.id).then(() => onActivity?.())
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function DayTaskRow({
  todo,
  completion,
  onOpen,
  onComplete,
  onUndo,
}: {
  todo: DayTodo
  completion: TodoCompletionState
  onOpen: () => void
  onComplete: () => void
  onUndo: () => void
}) {
  const recurring = isRecurring(todo.recurrence)
  const count = completion.count
  const isExpired = todo.expirationDate && new Date(todo.expirationDate) < new Date()
  const dueLabel = todo.expirationDate
    ? new Date(todo.expirationDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null

  return (
    <Card
      variant="outlined"
      interactive
      className="flex items-center gap-3 px-4 py-3"
      onClick={onOpen}
    >
      {recurring ? (
        <button
          aria-label="Registrar completado"
          onClick={(event) => {
            event.stopPropagation()
            onComplete()
          }}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            count > 0
              ? 'border-primary bg-primary text-on-primary'
              : 'border-outline text-transparent hover:border-primary'
          }`}
        >
          <Icon name="check" size={14} />
        </button>
      ) : (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: PRIORITY_COLORS[todo.priority] }}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-medium text-on-surface">{todo.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-small text-on-surface-variant">
            {STATUS_LABELS[todo.status]}
          </span>
          {recurring && (
            <span className="flex items-center gap-1 rounded-full bg-tertiary-container px-2 py-0.5 text-label-small text-on-tertiary-container">
              <Icon name="repeat" size={14} />
              {recurrenceSummary(todo.recurrence, todo.recurrenceDays)}
            </span>
          )}
          {recurring && count > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-primary-container px-2 py-0.5 text-label-small text-on-primary-container">
              <Icon name="check" size={14} />
              ×{count} {recurrencePeriodLabel(todo.recurrence)}
            </span>
          )}
          <span className="text-label-small text-on-surface-variant">
            {PRIORITY_LABELS[todo.priority]}
          </span>
          {dueLabel && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label-small ${
                isExpired
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              <Icon name="schedule" size={14} />
              {dueLabel}
            </span>
          )}
        </div>
      </div>
      {recurring && count > 0 && (
        <IconButton
          icon="undo"
          label="Deshacer último completado"
          size="sm"
          className="text-on-surface-variant hover:text-primary"
          onClick={(event) => {
            event.stopPropagation()
            onUndo()
          }}
        />
      )}
      <Icon name="chevron_right" size={20} className="shrink-0 text-on-surface-variant" />
    </Card>
  )
}
