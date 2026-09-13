import { useEffect, useState, useRef } from 'react'
import type { Todo, TodoStatus, Priority, Urgency } from '../types'
import { STATUS_LABELS, PRIORITY_LABELS, URGENCY_LABELS } from '../types'
import { X, Trash2, Calendar, Clock, ChevronDown, Pencil } from 'lucide-react'
import { BlockEditor } from './BlockEditor'
import { useProjectEpics } from '../hooks/useProjects'
import { ConfirmDialog, Tooltip } from './ui'

interface TodoDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  todo: Todo | null
  onUpdate: (updates: Partial<Todo>) => void
  onDelete: () => void
}

const DRAWER_WIDTH_KEY = 'tododex.drawerWidth'
const DRAWER_MIN_WIDTH = 360
const DRAWER_DEFAULT_WIDTH = 520

export function TodoDrawer({ open, onOpenChange, todo, onUpdate, onDelete }: TodoDrawerProps) {
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [width, setWidth] = useState(() => {
    const saved = Number(localStorage.getItem(DRAWER_WIDTH_KEY))
    return saved >= DRAWER_MIN_WIDTH ? saved : DRAWER_DEFAULT_WIDTH
  })
  const widthRef = useRef(width)

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()
    document.body.classList.add('select-none')
    document.body.style.cursor = 'col-resize'
    const onMove = (ev: MouseEvent) => {
      const max = window.innerWidth * 0.9
      const next = Math.min(Math.max(window.innerWidth - ev.clientX, DRAWER_MIN_WIDTH), max)
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

  const { epics, ensureEpic } = useProjectEpics(todo?.projectId)
  const [epicInput, setEpicInput] = useState('')
  const [showEpicSuggestions, setShowEpicSuggestions] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const epicRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (todo) {
      setEpicInput(todo.epic || '')
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

  useEffect(() => {
    if (open) {
      setVisible(true)
      requestAnimationFrame(() => setAnimating(true))
    } else {
      setAnimating(false)
      const timer = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (epicRef.current && !epicRef.current.contains(e.target as Node)) {
        setShowEpicSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!visible || !todo) return null

  const formatDate = (d: Date | string | null) => {
    if (!d) return '—'
    const date = d instanceof Date ? d : new Date(d)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const isExpired = todo.expirationDate && new Date(todo.expirationDate) < new Date()

  const handleEpicChange = (value: string) => {
    setEpicInput(value)
    onUpdate({ epic: value })
    if (value.trim()) {
      ensureEpic(value)
    }
  }

  const filteredEpics = epics.filter(
    (e) => epicInput && e.name.toLowerCase().includes(epicInput.toLowerCase()) && e.name !== epicInput
  )

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-nintendo-text/10 backdrop-blur-sm transition-opacity duration-300 ${
          animating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => onOpenChange(false)}
      />

      <div
        className={`fixed right-0 top-0 z-50 h-full bg-nintendo-card shadow-soft-lg border-l border-nintendo-border/60 flex flex-col transition-transform duration-300 ease-out ${
          animating ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width, maxWidth: '90vw' }}
      >
        <div
          onMouseDown={startResize}
          className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-lavender/60 active:bg-lavender transition-colors z-10"
        />
        <div className="flex items-center justify-between px-6 py-5 border-b border-nintendo-border/40 gap-3">
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => {
                if (titleDraft.trim() && titleDraft !== todo.title) {
                  onUpdate({ title: titleDraft.trim() })
                } else {
                  setTitleDraft(todo.title)
                }
                setEditingTitle(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (titleDraft.trim() && titleDraft !== todo.title) {
                    onUpdate({ title: titleDraft.trim() })
                  } else {
                    setTitleDraft(todo.title)
                  }
                  setEditingTitle(false)
                }
                if (e.key === 'Escape') {
                  setTitleDraft(todo.title)
                  setEditingTitle(false)
                }
              }}
              className="font-bold text-lg bg-nintendo-bg rounded-lg px-2 py-1 outline-none flex-1 min-w-0"
            />
          ) : (
            <div
              className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer hover:bg-nintendo-bg rounded-lg px-2 py-1 transition-colors group/title"
              onDoubleClick={() => setEditingTitle(true)}
            >
              <Tooltip content={todo.title} className="flex-1">
                <h2 className="font-bold text-lg text-nintendo-text truncate">
                  {todo.title}
                </h2>
              </Tooltip>
              <Pencil className="w-4 h-4 text-nintendo-muted/40 opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-xl hover:bg-nintendo-bg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-nintendo-muted" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-nintendo-border/40">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Estado">
              <select
                value={todo.status}
                onChange={(e) => onUpdate({ status: e.target.value as TodoStatus })}
                className="text-xs font-medium bg-nintendo-bg rounded-lg px-2 py-1 border-0 outline-none cursor-pointer"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>

            <Field label="Prioridad">
              <select
                value={todo.priority}
                onChange={(e) => onUpdate({ priority: e.target.value as Priority })}
                className="text-xs font-medium bg-nintendo-bg rounded-lg px-2 py-1 border-0 outline-none cursor-pointer"
              >
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>

            <Field label="Urgencia">
              <select
                value={todo.urgency}
                onChange={(e) => onUpdate({ urgency: e.target.value as Urgency })}
                className="text-xs font-medium bg-nintendo-bg rounded-lg px-2 py-1 border-0 outline-none cursor-pointer"
              >
                {Object.entries(URGENCY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>

            <Field label="Épica">
              <div ref={epicRef} className="relative">
                <div className="flex items-center">
                  <input
                    value={epicInput}
                    onChange={(e) => {
                      handleEpicChange(e.target.value)
                      setShowEpicSuggestions(true)
                    }}
                    onFocus={() => setShowEpicSuggestions(true)}
                    placeholder="Sin épica"
                    className="text-xs font-medium bg-nintendo-bg rounded-lg px-2 py-1 border-0 outline-none w-full"
                  />
                  {epics.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowEpicSuggestions(!showEpicSuggestions)}
                      className="ml-1 p-0.5 rounded hover:bg-nintendo-bg"
                    >
                      <ChevronDown className="w-3 h-3 text-nintendo-muted" />
                    </button>
                  )}
                </div>
                {showEpicSuggestions && filteredEpics.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-nintendo-card rounded-xl shadow-soft-md border border-nintendo-border/60 overflow-hidden z-10 max-h-32 overflow-y-auto">
                    {filteredEpics.map((epic) => (
                      <button
                        key={epic.id}
                        type="button"
                        className="w-full px-3 py-2 text-xs text-nintendo-text hover:bg-lavender/30 text-left transition-colors"
                        onClick={() => {
                          handleEpicChange(epic.name)
                          setShowEpicSuggestions(false)
                        }}
                      >
                        {epic.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <Field label="Creado">
              <span className="text-xs text-nintendo-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(todo.createdAt)}
              </span>
            </Field>

            <Field label="Expira">
              <div className="flex items-center gap-1">
                <Clock className={`w-3 h-3 ${isExpired ? 'text-coral-dark' : 'text-nintendo-muted'}`} />
                <input
                  type="date"
                  value={todo.expirationDate ? new Date(todo.expirationDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => onUpdate({ expirationDate: e.target.value ? new Date(e.target.value) : null })}
                  className={`text-xs font-medium bg-nintendo-bg rounded-lg px-2 py-1 border-0 outline-none ${
                    isExpired ? 'text-coral-dark' : ''
                  }`}
                />
              </div>
            </Field>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 px-6 py-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-nintendo-muted uppercase tracking-wide">
              Contenido
            </span>
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-1 text-xs text-coral-dark hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-coral/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          </div>
          <div className="flex-1 overflow-hidden rounded-2xl border border-nintendo-border/60">
            <BlockEditor
              content={todo.content}
              contentFormat={todo.contentFormat}
              todoId={todo.id}
              onChange={(content, contentFormat) => onUpdate({ content, contentFormat })}
            />
          </div>
        </div>
      </div>

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-nintendo-muted">
        {label}
      </span>
      {children}
    </div>
  )
}
