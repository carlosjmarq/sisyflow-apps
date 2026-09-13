import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, ArrowUpDown, X, SearchX } from 'lucide-react'
import { useProjects, useProjectTodos, useProjectEpics } from '../hooks/useProjects'
import { TodoItem } from './TodoItem'
import { TodoDrawer } from './TodoDrawer'
import { TodoForm } from './TodoForm'
import { Button, Select } from './ui'
import { useMemo, useState } from 'react'
import type { Todo, TodoSortKey, TodoStatus, Priority } from '../types'
import { PROJECT_COLORS, TODO_SORT_OPTIONS, STATUS_LABELS, PRIORITY_LABELS } from '../types'

const COLOR_MAP: Record<string, string> = Object.fromEntries(
  PROJECT_COLORS.map((c) => [c.value, c.bg])
)

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

const PRIORITY_FILTER_OPTIONS = [
  { value: 'all', label: 'Todas las prioridades' },
  ...Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
]

export function TodoList() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { projects } = useProjects()
  const [sortBy, setSortBy] = useState<TodoSortKey>('createdAt')
  const { todos, loading, createTodo, updateTodo, deleteTodo } = useProjectTodos(
    projectId ? Number(projectId) : undefined,
    sortBy
  )

  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | TodoStatus>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | Priority>('all')
  const [filterEpic, setFilterEpic] = useState('all')

  const { epics } = useProjectEpics(projectId ? Number(projectId) : undefined)

  const project = projects.find((p) => p.id === Number(projectId))
  const bgColor = project ? COLOR_MAP[project.color] || '#C7F9CC' : undefined

  const epicFilterOptions = useMemo(() => [
    { value: 'all', label: 'Todas las épicas' },
    ...epics.map((e) => ({ value: e.name, label: e.name })),
  ], [epics])

  const filteredTodos = useMemo(() => todos.filter((t) =>
    (filterStatus === 'all' || t.status === filterStatus) &&
    (filterPriority === 'all' || t.priority === filterPriority) &&
    (filterEpic === 'all' || t.epic === filterEpic)
  ), [todos, filterStatus, filterPriority, filterEpic])

  const hasActiveFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterEpic !== 'all'
  const clearFilters = () => {
    setFilterStatus('all')
    setFilterPriority('all')
    setFilterEpic('all')
  }

  const pendingTodos = filteredTodos.filter(t => t.status !== 'done' && t.status !== 'cancelled')
  const completedTodos = filteredTodos.filter(t => t.status === 'done')
  const cancelledTodos = filteredTodos.filter(t => t.status === 'cancelled')

  const handleSelectTodo = (todo: Todo) => {
    setSelectedTodo(todo)
    setDrawerOpen(true)
  }

  const handleUpdateTodo = async (id: number, updates: Partial<Todo>) => {
    await updateTodo(id, updates)
    if (selectedTodo?.id === id) {
      setSelectedTodo((prev) => prev ? { ...prev, ...updates } : null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-lavender/40 animate-pulse" />
          <span className="text-nintendo-muted text-sm">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <header
        className="px-8 py-6 flex items-center gap-4"
        style={bgColor ? { backgroundColor: bgColor + '80' } : undefined}
      >
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl hover:bg-white/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-nintendo-text/60" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-nintendo-text">
            {project?.name || 'Proyecto'}
          </h1>
          <p className="text-sm text-nintendo-muted">
            {hasActiveFilters ? `${filteredTodos.length} de ${todos.length} tareas` : `${todos.length} tareas`}
          </p>
        </div>
        <Button variant="primary" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />
          Nueva tarea
        </Button>
      </header>

      <div className="px-8 py-3 flex items-center gap-2 flex-wrap border-b border-nintendo-border/40">
        <Select
          icon={<ArrowUpDown className="w-3.5 h-3.5" />}
          options={TODO_SORT_OPTIONS}
          value={sortBy}
          onChange={(v) => setSortBy(v as TodoSortKey)}
        />
        <div className="w-px h-5 bg-nintendo-border/60 mx-1" />
        <Select
          options={STATUS_FILTER_OPTIONS}
          value={filterStatus}
          onChange={(v) => setFilterStatus(v as 'all' | TodoStatus)}
        />
        <Select
          options={PRIORITY_FILTER_OPTIONS}
          value={filterPriority}
          onChange={(v) => setFilterPriority(v as 'all' | Priority)}
        />
        {epicFilterOptions.length > 1 && (
          <Select
            options={epicFilterOptions}
            value={filterEpic}
            onChange={setFilterEpic}
          />
        )}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-coral-dark hover:bg-coral/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        {filteredTodos.length === 0 ? (
          todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-nintendo-muted">
              <div className="w-20 h-20 rounded-3xl bg-lavender/30 flex items-center justify-center">
                <Plus className="w-8 h-8" />
              </div>
              <p className="text-sm">No hay tareas aún. Crea la primera!</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-nintendo-muted">
              <div className="w-20 h-20 rounded-3xl bg-sky/30 flex items-center justify-center">
                <SearchX className="w-8 h-8" />
              </div>
              <p className="text-sm">No hay tareas que coincidan con los filtros</p>
              <Button variant="secondary" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-6">
            {pendingTodos.length > 0 && (
              <div className="flex flex-col gap-3">
                <SectionHeader label="Pendientes" count={pendingTodos.length} color="bg-sky" />
                {pendingTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onClick={() => handleSelectTodo(todo)}
                    onStatusChange={(status) => todo.id != null && handleUpdateTodo(todo.id, { status })}
                    onDelete={() => todo.id != null && deleteTodo(todo.id)}
                  />
                ))}
              </div>
            )}

            {completedTodos.length > 0 && pendingTodos.length > 0 && (
              <div className="flex items-center gap-3 px-2">
                <div className="flex-1 h-px bg-nintendo-border" />
                <span className="text-xs text-nintendo-muted font-medium">Completado</span>
                <div className="flex-1 h-px bg-nintendo-border" />
              </div>
            )}

            {completedTodos.length > 0 && (
              <div className="flex flex-col gap-3 opacity-75">
                <SectionHeader label="Completados" count={completedTodos.length} color="bg-mint" />
                {completedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onClick={() => handleSelectTodo(todo)}
                    onStatusChange={(status) => todo.id != null && handleUpdateTodo(todo.id, { status })}
                    onDelete={() => todo.id != null && deleteTodo(todo.id)}
                  />
                ))}
              </div>
            )}

            {cancelledTodos.length > 0 && (
              <div className="flex flex-col gap-3 opacity-60">
                <SectionHeader label="Cancelados" count={cancelledTodos.length} color="bg-coral/40" />
                {cancelledTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onClick={() => handleSelectTodo(todo)}
                    onStatusChange={(status) => todo.id != null && handleUpdateTodo(todo.id, { status })}
                    onDelete={() => todo.id != null && deleteTodo(todo.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <TodoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        todo={selectedTodo}
        onUpdate={(updates) => {
          if (selectedTodo?.id != null) handleUpdateTodo(selectedTodo.id, updates)
        }}
        onDelete={() => {
          if (selectedTodo?.id != null) {
            deleteTodo(selectedTodo.id)
            setDrawerOpen(false)
          }
        }}
      />

      <TodoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreate={(todo) => {
          createTodo({ ...todo, projectId: Number(projectId) })
        }}
      />
    </div>
  )
}

function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-semibold text-nintendo-muted uppercase tracking-wide">
        {label}
      </span>
      <span className="text-[10px] text-nintendo-muted bg-nintendo-bg px-1.5 py-0.5 rounded-full">
        {count}
      </span>
    </div>
  )
}
