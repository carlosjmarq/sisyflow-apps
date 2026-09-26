import { useCallback, useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { Todo, TodoStatus, TodoRecurrence, Priority, Urgency, Tag } from '../types'
import { STATUS_LABELS, PRIORITY_LABELS, URGENCY_LABELS, paletteHex } from '../types'
import { isRecurring, recurrencePeriodLabel } from '../lib/recurrence'
import type { TodoCompletionState } from '../hooks/useTodoCompletions'
import { BlockEditor } from './BlockEditor'
import { RecurrenceField } from './RecurrenceField'
import {
  Button,
  ConfirmDialog,
  Icon,
  IconButton,
  Select,
  TruncatedTooltip,
} from './ui'

interface TodoDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  todo: Todo | null
  projectEpic?: { name: string; colorCode: string } | null
  projectTags?: Tag[]
  onUpdate: (todoId: string, updates: Partial<Todo>) => void
  onDelete: () => void
  completionState?: TodoCompletionState
  onRecurrenceChange: (recurrence: TodoRecurrence, days: number[]) => void
  onRemoveCompletion: (completionId: string) => void
}

const DRAWER_WIDTH_KEY = 'tododex.drawerWidth'
const DRAWER_MIN_WIDTH = 360
const DRAWER_DEFAULT_WIDTH = 520
const CONTENT_DEBOUNCE_MS = 800

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))
const RECURRING_STATUS_OPTIONS = STATUS_OPTIONS.filter((option) => option.value !== 'done')
const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))
const URGENCY_OPTIONS = Object.entries(URGENCY_LABELS).map(([value, label]) => ({ value, label }))

export function TodoDrawer({
  open,
  onOpenChange,
  todo,
  projectEpic,
  projectTags = [],
  onUpdate,
  onDelete,
  completionState,
  onRecurrenceChange,
  onRemoveCompletion,
}: TodoDrawerProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [width, setWidth] = useState(() => {
    const saved = Number(localStorage.getItem(DRAWER_WIDTH_KEY))
    return saved >= DRAWER_MIN_WIDTH ? saved : DRAWER_DEFAULT_WIDTH
  })
  const widthRef = useRef(width)

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Debounce del contenido: BlockNote emite en cada cambio; escribir a Supabase
  // en cada tecla saturaría la red. Se aplica tras 800 ms sin cambios y se
  // fuerza el guardado al cambiar de tarea, cerrar el drawer o desmontar.
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  const contentTimer = useRef<ReturnType<typeof setTimeout>>()
  const pendingContent = useRef<{ content: string; contentFormat: 'blocknote' } | null>(null)
  const pendingTodoId = useRef<string | null>(null)

  const flushContent = useCallback(() => {
    if (contentTimer.current) {
      clearTimeout(contentTimer.current)
      contentTimer.current = undefined
    }
    if (pendingContent.current && pendingTodoId.current) {
      onUpdateRef.current(pendingTodoId.current, pendingContent.current)
    }
    pendingContent.current = null
    pendingTodoId.current = null
  }, [])

  const scheduleContentChange = useCallback(
    (todoId: string, content: string, contentFormat: 'blocknote') => {
      pendingTodoId.current = todoId
      pendingContent.current = { content, contentFormat }
      if (contentTimer.current) clearTimeout(contentTimer.current)
      contentTimer.current = setTimeout(() => {
        if (pendingContent.current && pendingTodoId.current) {
          onUpdateRef.current(pendingTodoId.current, pendingContent.current)
        }
        pendingContent.current = null
        pendingTodoId.current = null
        contentTimer.current = undefined
      }, CONTENT_DEBOUNCE_MS)
    },
    [],
  )

  useEffect(() => () => flushContent(), [flushContent])
  useEffect(() => {
    flushContent()
  }, [todo?.id, flushContent])
  useEffect(() => {
    if (!open) flushContent()
  }, [open, flushContent])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  const startResize = (event: React.MouseEvent) => {
    event.preventDefault()
    document.body.classList.add('select-none')
    document.body.style.cursor = 'col-resize'
    const onMove = (moveEvent: MouseEvent) => {
      const max = window.innerWidth * 0.9
      const next = Math.min(Math.max(window.innerWidth - moveEvent.clientX, DRAWER_MIN_WIDTH), max)
      widthRef.current = next
      setWidth(next)
    }
    const onUp = () => {
      document.body.classList.remove('select-none')
      document.body.style.cursor = ''
      localStorage.setItem(DRAWER_WIDTH_KEY, String(widthRef.current))
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  useEffect(() => {
    if (todo) {
      setTitleDraft(todo.title)
      setEditingTitle(false)
    }
  }, [todo])

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  const formatDate = (value: Date | string | null) => {
    if (!value) return '—'
    const date = value instanceof Date ? value : new Date(value)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const isExpired = todo?.expirationDate && new Date(todo.expirationDate) < new Date()
  const recurring = todo ? isRecurring(todo.recurrence) : false
  const completionItems = completionState?.items ?? []

  const formatDateTime = (value: Date) => {
    const date = value instanceof Date ? value : new Date(value)
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const commitTitle = () => {
    if (!todo) return
    if (titleDraft.trim() && titleDraft.trim() !== todo.title) {
      onUpdate(todo.id, { title: titleDraft.trim() })
    } else {
      setTitleDraft(todo.title)
    }
    setEditingTitle(false)
  }

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {open && todo && (
            <>
            <motion.div
              key="drawer-overlay"
              className="fixed inset-0 z-40 bg-scrim/32"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => onOpenChange(false)}
            />
            <motion.aside
              key="drawer-sheet"
              role="dialog"
              aria-label={`Detalle de ${todo.title}`}
              className="fixed right-0 top-0 z-50 flex h-full flex-col bg-surface-container-low shadow-elev-3"
              style={{ width, maxWidth: '90vw' }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.05, 0.7, 0.1, 1] }}
            >
              <div
                onMouseDown={startResize}
                className="absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize transition-colors hover:bg-primary/40 active:bg-primary/60"
              />

              <div className="flex items-center justify-between gap-3 px-6 py-4">
                {editingTitle ? (
                  <input
                    ref={titleInputRef}
                    value={titleDraft}
                    onChange={(event) => setTitleDraft(event.target.value)}
                    onBlur={commitTitle}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitTitle()
                      if (event.key === 'Escape') {
                        setTitleDraft(todo.title)
                        setEditingTitle(false)
                      }
                    }}
                    className="min-w-0 flex-1 rounded-xs bg-surface-container-high px-3 py-2 text-title-large text-on-surface outline-none"
                  />
                ) : (
                  <div
                    className="group/title flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xs px-1 py-1 transition-colors hover:bg-surface-container-high"
                    onDoubleClick={() => setEditingTitle(true)}
                  >
                    <TruncatedTooltip content={todo.title} className="flex-1">
                      <h2 className="truncate text-title-large text-on-surface">{todo.title}</h2>
                    </TruncatedTooltip>
                    <Icon
                      name="edit"
                      size={18}
                      className="shrink-0 text-on-surface-variant/50 opacity-0 transition-opacity group-hover/title:opacity-100"
                    />
                  </div>
                )}
                <IconButton icon="close" label="Cerrar" onClick={() => onOpenChange(false)} />
              </div>

              <div className="grid grid-cols-2 gap-3 px-6 py-4">
                <Select
                  label="Estado"
                  labelBgClass="bg-surface-container-low"
                  options={recurring ? RECURRING_STATUS_OPTIONS : STATUS_OPTIONS}
                  value={todo.status}
                  onChange={(value) => onUpdate(todo.id, { status: value as TodoStatus })}
                />
                <Select
                  label="Prioridad"
                  labelBgClass="bg-surface-container-low"
                  options={PRIORITY_OPTIONS}
                  value={todo.priority}
                  onChange={(value) => onUpdate(todo.id, { priority: value as Priority })}
                />
                <Select
                  label="Urgencia"
                  labelBgClass="bg-surface-container-low"
                  options={URGENCY_OPTIONS}
                  value={todo.urgency}
                  onChange={(value) => onUpdate(todo.id, { urgency: value as Urgency })}
                />
                <RecurrenceField
                  recurrence={todo.recurrence}
                  days={todo.recurrenceDays ?? []}
                  labelBgClass="bg-surface-container-low"
                  onChange={onRecurrenceChange}
                />
                <Field label="Épica">
                  {projectEpic ? (
                    <span className="flex items-center gap-2 text-body-medium text-on-surface">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: projectEpic.colorCode }}
                      />
                      {projectEpic.name}
                    </span>
                  ) : (
                    <span className="text-body-medium text-on-surface-variant">—</span>
                  )}
                </Field>

                <Field label="Creado">
                  <span className="flex items-center gap-1.5 text-body-medium text-on-surface-variant">
                    <Icon name="event" size={16} />
                    {formatDate(todo.createdAt)}
                  </span>
                </Field>

                {todo.completedAt && (
                  <Field label="Completado">
                    <span className="flex items-center gap-1.5 text-body-medium text-primary">
                      <Icon name="check_circle" size={16} />
                      {formatDate(todo.completedAt)}
                    </span>
                  </Field>
                )}

                <Field label="Expira">
                  <div
                    className={`flex h-12 items-center gap-2 rounded-xs border px-3 ${
                      isExpired ? 'border-error' : 'border-outline'
                    }`}
                  >
                    <Icon
                      name="schedule"
                      size={18}
                      className={isExpired ? 'text-error' : 'text-on-surface-variant'}
                    />
                    <input
                      type="date"
                      value={
                        todo.expirationDate
                          ? new Date(todo.expirationDate).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(event) =>
                        onUpdate(todo.id, {
                          expirationDate: event.target.value ? new Date(event.target.value) : null,
                        })
                      }
                      className={`w-full bg-transparent text-body-medium outline-none ${
                        isExpired ? 'text-error' : 'text-on-surface'
                      }`}
                    />
                  </div>
                </Field>
              </div>

              {projectTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 px-6 pb-2">
                  {projectTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="flex items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-1 text-label-medium text-on-surface-variant"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tag.color ? paletteHex(tag.color) : 'rgb(var(--md-outline))' }}
                      />
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {recurring && (
                <div className="flex flex-col gap-2 px-6 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-label-large text-on-surface-variant">Historial</span>
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-small text-on-surface-variant">
                      {completionState?.count ?? 0} {recurrencePeriodLabel(todo.recurrence)}
                    </span>
                  </div>
                  {completionItems.length === 0 ? (
                    <p className="text-body-small text-on-surface-variant">
                      Aún no hay completados registrados.
                    </p>
                  ) : (
                    <div className="flex max-h-40 flex-col gap-1 overflow-y-auto pr-1">
                      {completionItems.slice(0, 20).map((completion) => (
                        <div
                          key={completion.id}
                          className="flex items-center justify-between gap-2 rounded-xs bg-surface-container px-3 py-1.5"
                        >
                          <span className="flex items-center gap-2 text-body-small text-on-surface-variant">
                            <Icon name="check_circle" size={16} className="text-primary" />
                            {formatDateTime(completion.completedAt)}
                          </span>
                          <IconButton
                            icon="delete"
                            label="Eliminar completado"
                            size="sm"
                            className="hover:text-error"
                            onClick={() => onRemoveCompletion(completion.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
                <span className="mb-3 text-label-large text-on-surface-variant">Contenido</span>
                <div className="min-h-0 flex-1 overflow-hidden rounded-md bg-surface-container-low">
                  <BlockEditor
                    content={todo.content}
                    contentFormat={todo.contentFormat}
                    todoId={todo.id}
                    onChange={(content, contentFormat) =>
                      scheduleContentChange(todo.id, content, contentFormat)
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end px-6 pb-4">
                <Button
                  variant="text"
                  icon="delete"
                  className="text-error"
                  onClick={() => setDeleteOpen(true)}
                >
                  Eliminar tarea
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>,
        document.body,
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar tarea"
        description={`Se eliminará permanentemente la tarea "${todo?.title ?? ''}". Esta acción no se puede deshacer.`}
        onConfirm={onDelete}
      />
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-medium text-on-surface-variant">{label}</span>
      <div className="flex min-h-12 items-center">{children}</div>
    </div>
  )
}
