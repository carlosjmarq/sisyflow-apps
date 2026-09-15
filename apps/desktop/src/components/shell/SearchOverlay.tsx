import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../ui/Icon'
import { IconButton } from '../ui/IconButton'
import { Skeleton } from '../ui/Skeleton'
import { useSearchTodos } from '../../hooks/useSearchTodos'
import { useProjects } from '../../hooks/useProjects'
import { STATUS_LABELS } from '../../types'

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
}

function SearchBody({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const { results, loading } = useSearchTodos(query)
  const { projects } = useProjects()
  const navigate = useNavigate()

  const projectMap = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleSelect = (projectId: string, todoId: string) => {
    navigate(`/project/${projectId}`, { state: { openTodoId: todoId } })
    onClose()
  }

  return (
    <div className="mx-auto flex h-full max-w-[760px] flex-col px-6 py-4">
      <div className="flex items-center gap-2">
        <IconButton icon="arrow_back" label="Cerrar búsqueda" onClick={onClose} />
        <div className="flex h-14 flex-1 items-center gap-3 rounded-full bg-surface-container-high px-4">
          <Icon name="search" size={24} className="text-on-surface-variant" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar tareas…"
            className="h-full min-w-0 flex-1 bg-transparent text-body-large text-on-surface outline-none placeholder:text-on-surface-variant"
          />
          {query && <IconButton icon="close" label="Limpiar" size="sm" onClick={() => setQuery('')} />}
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto pb-8">
        {query.trim().length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-24 text-center">
            <Icon name="search" size={48} className="text-on-surface-variant/60" />
            <p className="text-body-medium text-on-surface-variant">
              Escribí para buscar tareas por título.
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-2 pt-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-sm" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-24 text-center">
            <Icon name="search_off" size={48} className="text-on-surface-variant/60" />
            <p className="text-body-medium text-on-surface-variant">
              Sin resultados para “{query.trim()}”.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {results.map((todo) => {
              const project = projectMap.get(todo.projectId)
              return (
                <li key={todo.id}>
                  <button
                    onClick={() => handleSelect(todo.projectId, todo.id)}
                    className="state-layer flex w-full items-center gap-3 rounded-sm px-3 py-3 text-left"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: project?.color ?? 'rgb(var(--md-primary))' }}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-body-large text-on-surface ${
                          todo.status === 'done' ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {todo.title}
                      </span>
                      <span className="block truncate text-body-small text-on-surface-variant">
                        {project?.name ?? 'Proyecto'} · {STATUS_LABELS[todo.status]}
                      </span>
                    </span>
                    <Icon name="chevron_right" size={20} className="text-on-surface-variant" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] bg-surface"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.05, 0.7, 0.1, 1] }}
        >
          <SearchBody onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
