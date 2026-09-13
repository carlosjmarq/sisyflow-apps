import { Check, Trash2, ChevronRight, Clock, Flame, Calendar } from 'lucide-react'
import { useState } from 'react'
import type { Todo, TodoStatus } from '../types'
import { STATUS_LABELS, PRIORITY_LABELS, URGENCY_LABELS } from '../types'
import { Card, ConfirmDialog, Tooltip } from './ui'

const STATUS_COLORS: Record<TodoStatus, string> = {
  backlog: 'bg-nintendo-muted/20',
  todo: 'bg-sky/50',
  'in-progress': 'bg-butter/50',
  done: 'bg-mint/50',
  cancelled: 'bg-coral/30',
}

const PRIORITY_DOTS: Record<string, string> = {
  low: 'bg-mint-dark',
  medium: 'bg-butter-dark',
  high: 'bg-coral-dark',
  critical: 'bg-red-400',
}

const URGENCY_COLORS: Record<string, string> = {
  low: 'text-mint-dark',
  medium: 'text-butter-dark',
  high: 'text-coral-dark',
  critical: 'text-red-400',
}

export function TodoItem({ todo, onClick, onStatusChange, onDelete }: {
  todo: Todo
  onClick: () => void
  onStatusChange: (status: TodoStatus) => void
  onDelete: () => void
}) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isDone = todo.status === 'done'
  const nextStatus: TodoStatus = isDone ? 'todo' : 'done'

  const formatDate = (d: Date | null) => {
    if (!d) return null
    const date = d instanceof Date ? d : new Date(d)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const isExpired = todo.expirationDate && new Date(todo.expirationDate) < new Date()

  return (
    <>
    <Card hoverable className="p-4 flex items-center gap-4">
      <button
        onClick={(e) => { e.stopPropagation(); onStatusChange(nextStatus) }}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          isDone
            ? 'bg-mint-dark border-mint-dark'
            : 'border-nintendo-border hover:border-mint-dark'
        }`}
      >
        {isDone && <Check className="w-3.5 h-3.5 text-white" />}
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <Tooltip content={todo.title}>
          <p className={`text-sm font-semibold truncate ${isDone ? 'line-through text-nintendo-muted' : 'text-nintendo-text'}`}>
            {todo.title}
          </p>
        </Tooltip>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[todo.status]}`}>
            {STATUS_LABELS[todo.status]}
          </span>
          {todo.epic && (
            <span className="text-[10px] text-nintendo-muted bg-nintendo-bg px-2 py-0.5 rounded-full">
              {todo.epic}
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] text-nintendo-muted">
            <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOTS[todo.priority]}`} />
            {PRIORITY_LABELS[todo.priority]}
          </span>
          <span className={`flex items-center gap-1 text-[10px] ${URGENCY_COLORS[todo.urgency]}`}>
            <Flame className="w-3 h-3" />
            {URGENCY_LABELS[todo.urgency]}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-nintendo-muted">
            <Calendar className="w-3 h-3" />
            {formatDate(todo.createdAt)}
          </span>
          {todo.expirationDate && (
            <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
              isExpired && !isDone ? 'bg-coral/40 text-red-500' : 'text-nintendo-muted bg-nintendo-bg'
            }`}>
              <Clock className="w-3 h-3" />
              {formatDate(todo.expirationDate)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteOpen(true) }}
          className="p-2 rounded-xl hover:bg-coral/30 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-nintendo-text/30 hover:text-coral-dark" />
        </button>
        <ChevronRight className="w-5 h-5 text-nintendo-muted/40" onClick={onClick} />
      </div>
    </Card>

    <ConfirmDialog
      open={deleteOpen}
      onOpenChange={setDeleteOpen}
      title="Eliminar tarea"
      description={`Se eliminara permanentemente la tarea "${todo.title}". Esta accion no se puede deshacer.`}
      onConfirm={onDelete}
    />
    </>
  )
}
