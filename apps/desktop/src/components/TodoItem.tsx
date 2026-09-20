import { useState } from 'react'
import { motion } from 'motion/react'
import { Card, ConfirmDialog, Icon, IconButton, TruncatedTooltip } from './ui'
import { isRecurring } from '../lib/recurrence'
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  RECURRENCE_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
  type Todo,
  type TodoStatus,
} from '../types'

const STATUS_BADGES: Record<TodoStatus, string> = {
  backlog: 'bg-surface-container-highest text-on-surface-variant',
  todo: 'bg-secondary-container text-on-secondary-container',
  'in-progress': 'bg-tertiary-container text-on-tertiary-container',
  done: 'bg-primary-container text-on-primary-container',
  cancelled: 'bg-surface-container-highest text-on-surface-variant',
}

export function TodoItem({
  todo,
  epicName,
  epicColor,
  onClick,
  onStatusChange,
  onDelete,
  completionCount = 0,
  completionLabel = '',
  completionLastAt,
  onComplete,
  onUndoCompletion,
}: {
  todo: Todo
  epicName?: string
  epicColor?: string
  onClick: () => void
  onStatusChange: (status: TodoStatus) => void
  onDelete: () => void
  completionCount?: number
  completionLabel?: string
  completionLastAt?: Date | null
  onComplete?: () => void
  onUndoCompletion?: () => void
}) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const recurring = isRecurring(todo.recurrence)
  const isDone = !recurring && todo.status === 'done'
  const isCancelled = todo.status === 'cancelled'
  const isChecked = recurring ? completionCount > 0 : isDone
  const nextStatus: TodoStatus = isDone ? 'todo' : 'done'

  const formatDate = (value: Date | null) => {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const isExpired = todo.expirationDate && new Date(todo.expirationDate) < new Date()

  return (
    <>
      <Card
        variant="outlined"
        interactive
        className={`group flex items-center gap-3 px-4 py-3 ${
          isCancelled ? 'opacity-70' : ''
        }`}
      >
        <button
          aria-label={recurring ? 'Registrar completado' : isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
          onClick={(event) => {
            event.stopPropagation()
            if (recurring) onComplete?.()
            else onStatusChange(nextStatus)
          }}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            isChecked
              ? 'border-primary bg-primary text-on-primary'
              : 'border-outline text-transparent hover:border-primary'
          }`}
        >
          {isChecked ? (
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 600, damping: 24 }}
              className="flex"
            >
              <Icon name="check" size={14} />
            </motion.span>
          ) : (
            <Icon name="check" size={14} />
          )}
        </button>

        <div className="min-w-0 flex-1 cursor-pointer" onClick={onClick}>
          <TruncatedTooltip content={todo.title}>
            <p
              className={`truncate text-body-medium ${
                isDone || isCancelled
                  ? 'text-on-surface-variant line-through'
                  : 'text-on-surface'
              }`}
            >
              {todo.title}
            </p>
          </TruncatedTooltip>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`rounded-full px-2 py-0.5 text-label-small ${STATUS_BADGES[todo.status]}`}>
              {STATUS_LABELS[todo.status]}
            </span>
            {recurring && (
              <span className="flex items-center gap-1 rounded-full bg-tertiary-container px-2 py-0.5 text-label-small text-on-tertiary-container">
                <Icon name="repeat" size={14} />
                {RECURRENCE_LABELS[todo.recurrence]}
              </span>
            )}
            {recurring && completionCount > 0 && (
              <span
                className="flex items-center gap-1 rounded-full bg-primary-container px-2 py-0.5 text-label-small text-on-primary-container"
                title={completionLastAt ? `Último: ${formatDate(completionLastAt)}` : undefined}
              >
                <Icon name="check" size={14} />
                ×{completionCount} {completionLabel}
              </span>
            )}
            {epicName && (
              <span className="flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 text-label-small text-on-surface-variant">
                {epicColor && (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: epicColor }} />
                )}
                {epicName}
              </span>
            )}
            <span className="flex items-center gap-1 text-label-small text-on-surface-variant">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: PRIORITY_COLORS[todo.priority] }}
              />
              {PRIORITY_LABELS[todo.priority]}
            </span>
            <span
              className="flex items-center gap-1 text-label-small"
              style={{ color: PRIORITY_COLORS[todo.urgency] }}
            >
              <Icon name="local_fire_department" size={14} filled />
              {URGENCY_LABELS[todo.urgency]}
            </span>
            <span className="flex items-center gap-1 text-label-small text-on-surface-variant">
              <Icon name="event" size={14} />
              {formatDate(todo.createdAt)}
            </span>
            {todo.expirationDate && (
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-label-small ${
                  isExpired && !isDone
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <Icon name="schedule" size={14} />
                {formatDate(todo.expirationDate)}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          {recurring && completionCount > 0 && onUndoCompletion && (
            <IconButton
              icon="undo"
              label="Deshacer último completado"
              size="sm"
              className="text-on-surface-variant hover:text-primary"
              onClick={(event) => {
                event.stopPropagation()
                onUndoCompletion()
              }}
            />
          )}
          <IconButton
            icon="delete"
            label="Eliminar tarea"
            size="sm"
            className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 hover:text-error"
            onClick={(event) => {
              event.stopPropagation()
              setDeleteOpen(true)
            }}
          />
          <Icon name="chevron_right" size={20} className="text-on-surface-variant/60" />
        </div>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar tarea"
        description={`Se eliminará permanentemente la tarea "${todo.title}". Esta acción no se puede deshacer.`}
        onConfirm={onDelete}
      />
    </>
  )
}
