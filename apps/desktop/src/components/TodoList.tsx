import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useProjectTags, useProjects, useProjectTodos } from '../hooks/useProjects'
import { TodoItem } from './TodoItem'
import { TodoDrawer } from './TodoDrawer'
import { TodoForm } from './TodoForm'
import { TagsManager } from './TagsManager'
import {
  Button,
  Card,
  Fab,
  FilterMenu,
  Icon,
  IconButton,
  Menu,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
  Skeleton,
} from './ui'
import { TopAppBar } from './shell/TopAppBar'
import { recurrencePeriodLabel } from '../lib/recurrence'
import type { Priority, Todo, TodoRecurrence, TodoSortKey, TodoStatus } from '../types'
import {
  TODO_SORT_OPTIONS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  paletteHex,
} from '../types'

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
  const location = useLocation()
  const { projects } = useProjects()
  const [sortBy, setSortBy] = useState<TodoSortKey>('createdAt')
  const {
    todos,
    loading,
    createTodo,
    updateTodo,
    deleteTodo,
    completionsForTodo,
    completeTodo,
    removeCompletion,
    undoLastCompletion,
    changeRecurrence,
  } = useProjectTodos(projectId, sortBy)
  const { tags } = useProjectTags(projectId)

  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | TodoStatus>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | Priority>('all')
  const openedFromState = useRef(false)

  const project = projects.find((item) => item.id === projectId)
  const projectEpic = project?.epic ?? null

  useEffect(() => {
    const state = location.state as { openTodoId?: string } | null
    if (!state?.openTodoId || loading || openedFromState.current) return
    const todo = todos.find((item) => item.id === state.openTodoId)
    if (!todo) return
    openedFromState.current = true
    setSelectedTodo(todo)
    setDrawerOpen(true)
    navigate(location.pathname, { replace: true, state: null })
  }, [location, loading, todos, navigate])

  const filteredTodos = useMemo(
    () =>
      todos.filter(
        (todo) =>
          (filterStatus === 'all' || todo.status === filterStatus) &&
          (filterPriority === 'all' || todo.priority === filterPriority),
      ),
    [todos, filterStatus, filterPriority],
  )

  const hasActiveFilters = filterStatus !== 'all' || filterPriority !== 'all'
  const clearFilters = () => {
    setFilterStatus('all')
    setFilterPriority('all')
  }

  const pendingTodos = filteredTodos.filter((todo) => todo.status !== 'done' && todo.status !== 'cancelled')
  const completedTodos = filteredTodos.filter((todo) => todo.status === 'done')
  const cancelledTodos = filteredTodos.filter((todo) => todo.status === 'cancelled')

  const handleSelectTodo = (todo: Todo) => {
    setSelectedTodo(todo)
    setDrawerOpen(true)
  }

  const handleUpdateTodo = async (id: string, updates: Partial<Todo>) => {
    await updateTodo(id, updates)
    if (selectedTodo?.id === id) {
      setSelectedTodo((prev) => (prev ? { ...prev, ...updates } : null))
    }
  }

  const handleRecurrenceChange = async (id: string, recurrence: TodoRecurrence) => {
    await changeRecurrence(id, recurrence)
    if (selectedTodo?.id === id) {
      setSelectedTodo((prev) =>
        prev
          ? {
              ...prev,
              recurrence,
              ...(prev.status === 'done' && recurrence !== 'none'
                ? { status: 'todo' as TodoStatus, completedAt: null }
                : {}),
            }
          : null,
      )
    }
  }

  const renderTodo = (todo: Todo) => {
    const completion = completionsForTodo(todo.id)
    return (
      <TodoItem
        key={todo.id}
        todo={todo}
        epicName={projectEpic?.name}
        epicColor={projectEpic?.colorCode}
        onClick={() => handleSelectTodo(todo)}
        onStatusChange={(status) => handleUpdateTodo(todo.id, { status })}
        onDelete={() => deleteTodo(todo.id)}
        completionCount={completion.count}
        completionLabel={recurrencePeriodLabel(todo.recurrence)}
        completionLastAt={completion.lastCompletedAt}
        onComplete={() => void completeTodo(todo.id)}
        onUndoCompletion={() => void undoLastCompletion(todo.id)}
      />
    )
  }

  const subtitle = project
    ? `${projectEpic ? `${projectEpic.name} · ` : ''}${todos.length} tarea${todos.length === 1 ? '' : 's'}`
    : undefined

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <TopAppBar
        title={project?.name ?? 'Proyecto'}
        subtitle={subtitle}
        onBack={() => navigate('/')}
        actions={
          <IconButton icon="sell" label="Etiquetas del proyecto" onClick={() => setTagsOpen(true)} />
        }
      />

      <div className="flex-1 overflow-y-auto px-6 pb-28 pt-2">
        <div className="mx-auto flex max-w-[960px] flex-col gap-4">
          {project && project.status !== 'active' && (
            <div className="flex items-start gap-3 rounded-md bg-tertiary-container px-4 py-3 text-on-tertiary-container">
              <Icon name="info" size={20} className="mt-0.5 shrink-0" />
              <p className="text-body-medium">
                Proyecto {project.status === 'paused' ? 'pausado' : 'completado'}: sus tareas
                pendientes no aparecen en «Tareas del día». El historial se conserva.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1">
            <Menu>
              <MenuTrigger asChild>
                <button className="state-layer flex h-10 items-center gap-2 rounded-full px-4 text-label-large text-on-surface-variant transition-colors hover:text-on-surface">
                  <Icon name="sort" size={18} />
                  {TODO_SORT_OPTIONS.find((option) => option.value === sortBy)?.label}
                </button>
              </MenuTrigger>
              <MenuContent align="start">
                <MenuRadioGroup
                  value={sortBy}
                  onValueChange={(value: string) => setSortBy(value as TodoSortKey)}
                >
                  {TODO_SORT_OPTIONS.map((option) => (
                    <MenuRadioItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuContent>
            </Menu>

            <FilterMenu
              label="Estado"
              value={filterStatus}
              options={STATUS_FILTER_OPTIONS}
              onChange={(value) => setFilterStatus(value as 'all' | TodoStatus)}
            />
            <FilterMenu
              label="Prioridad"
              value={filterPriority}
              options={PRIORITY_FILTER_OPTIONS}
              onChange={(value) => setFilterPriority(value as 'all' | Priority)}
            />
            {hasActiveFilters && (
              <Button variant="text" size="sm" icon="close" onClick={clearFilters}>
                Limpiar
              </Button>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 text-label-medium text-on-surface-variant"
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

          {loading ? (
            <div className="flex flex-col gap-2 pt-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-[68px] w-full rounded-md" />
              ))}
            </div>
          ) : filteredTodos.length === 0 ? (
            todos.length === 0 ? (
              <Card variant="outlined" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <Icon name="add_task" size={40} className="text-on-surface-variant/60" />
                <p className="text-body-medium text-on-surface">No hay tareas aún</p>
                <Button variant="tonal" icon="add" onClick={() => setFormOpen(true)}>
                  Crear primera tarea
                </Button>
              </Card>
            ) : (
              <Card variant="outlined" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <Icon name="search_off" size={40} className="text-on-surface-variant/60" />
                <p className="text-body-medium text-on-surface">No hay tareas que coincidan con los filtros</p>
                <Button variant="text" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </Card>
            )
          ) : (
            <div className="flex flex-col gap-6">
              {pendingTodos.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionHeader label="Pendientes" count={pendingTodos.length} />
                  {pendingTodos.map(renderTodo)}
                </div>
              )}

              {completedTodos.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionHeader label="Completados" count={completedTodos.length} />
                  <div className="flex flex-col gap-2 opacity-75">
                    {completedTodos.map(renderTodo)}
                  </div>
                </div>
              )}

              {cancelledTodos.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionHeader label="Cancelados" count={cancelledTodos.length} />
                  <div className="flex flex-col gap-2 opacity-60">
                    {cancelledTodos.map(renderTodo)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 right-6">
        <Fab icon="add" label="Nueva tarea" onClick={() => setFormOpen(true)} />
      </div>

      <TodoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        todo={selectedTodo}
        projectEpic={projectEpic}
        projectTags={tags}
        onUpdate={handleUpdateTodo}
        onDelete={() => {
          if (selectedTodo?.id != null) {
            deleteTodo(selectedTodo.id)
            setDrawerOpen(false)
          }
        }}
        completionState={selectedTodo ? completionsForTodo(selectedTodo.id) : undefined}
        onRecurrenceChange={(recurrence) => {
          if (selectedTodo) void handleRecurrenceChange(selectedTodo.id, recurrence)
        }}
        onRemoveCompletion={(completionId) => void removeCompletion(completionId)}
      />

      <TodoForm open={formOpen} onOpenChange={setFormOpen} onCreate={createTodo} />

      {projectId && (
        <TagsManager projectId={projectId} open={tagsOpen} onOpenChange={setTagsOpen} />
      )}
    </div>
  )
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-label-large text-on-surface-variant">{label}</span>
      <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-small text-on-surface-variant">
        {count}
      </span>
    </div>
  )
}
