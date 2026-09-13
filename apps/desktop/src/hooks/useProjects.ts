import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/ui/ToastContext'
import {
  mapEpic,
  mapProject,
  mapTag,
  mapTodo,
  projectUpdateFromDomain,
  todoInsertFromDomain,
  todoUpdateFromDomain,
  type ProjectUpdatableFields,
  type ProjectWithDetailsRow,
} from '../data/mappers'
import type { Epic, Priority, Project, Tag, TagColor, Todo, TodoSortKey, TodoStatus, Urgency } from '../types'

const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
const statusOrder: Record<string, number> = { 'todo': 1, 'in-progress': 2, 'backlog': 3, 'done': 4, 'cancelled': 5 }

function sortTodos(todos: Todo[], sortBy: TodoSortKey): Todo[] {
  return [...todos].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      case 'status':
        return statusOrder[a.status] - statusOrder[b.status]
      case 'title':
        return a.title.localeCompare(b.title)
      case 'expirationDate':
        if (!a.expirationDate && !b.expirationDate) return 0
        if (!a.expirationDate) return 1
        if (!b.expirationDate) return -1
        return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
      case 'updatedAt':
        if (!a.updatedAt && !b.updatedAt) return 0
        if (!a.updatedAt) return 1
        if (!b.updatedAt) return -1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'createdAt':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })
}

export function useProjects() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const loadProjects = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('projects')
      .select('*, epics(id, name, color_code), todos(status)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      showToast('No se pudieron cargar los proyectos')
      setLoading(false)
      return
    }
    setProjects(((data ?? []) as unknown as ProjectWithDetailsRow[]).map(mapProject))
    setLoading(false)
  }, [user, showToast])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const createProject = useCallback(async (name: string, color: string, epicId: string) => {
    if (!user) return null
    const optimistic: Project = {
      id: crypto.randomUUID(),
      epicId,
      name,
      color,
      status: 'active',
      createdAt: new Date(),
      todoCount: 0,
      doneCount: 0,
    }
    setProjects((prev) => [optimistic, ...prev])

    const { error } = await supabase.from('projects').insert({
      id: optimistic.id,
      user_id: user.id,
      epic_id: epicId,
      name,
      color_code: color,
      status: 'active',
      created_at: optimistic.createdAt.toISOString(),
    })

    if (error) {
      console.error(error)
      setProjects((prev) => prev.filter((p) => p.id !== optimistic.id))
      showToast('No se pudo crear el proyecto')
      return null
    }
    void loadProjects()
    return optimistic.id
  }, [user, showToast, loadProjects])

  const updateProject = useCallback(async (id: string, updates: ProjectUpdatableFields) => {
    const previous = projects
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))

    const { error } = await supabase.from('projects').update(projectUpdateFromDomain(updates)).eq('id', id)
    if (error) {
      console.error(error)
      setProjects(previous)
      showToast('No se pudo actualizar el proyecto')
    }
  }, [projects, showToast])

  const deleteProject = useCallback(async (id: string) => {
    const previous = projects
    setProjects((prev) => prev.filter((p) => p.id !== id))

    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) {
      console.error(error)
      setProjects(previous)
      showToast('No se pudo eliminar el proyecto')
    }
  }, [projects, showToast])

  return { projects, loading, createProject, updateProject, deleteProject, reload: loadProjects }
}

export interface NewTodoInput {
  title: string
  status: TodoStatus
  priority: Priority
  urgency: Urgency
  content: string
  contentFormat: 'blocknote'
  createdAt: Date
  expirationDate: Date | null
}

export function useProjectTodos(projectId: string | undefined, sortBy: TodoSortKey = 'createdAt') {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  const loadTodos = useCallback(async () => {
    if (!projectId || !user) {
      setTodos([])
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('project_id', projectId)

    if (error) {
      console.error(error)
      showToast('No se pudieron cargar las tareas')
      setLoading(false)
      return
    }
    setTodos(sortTodos((data ?? []).map(mapTodo), sortBy))
    setLoading(false)
  }, [projectId, user, showToast, sortBy])

  useEffect(() => {
    setLoading(true)
    loadTodos()
  }, [loadTodos])

  const createTodo = useCallback(async (input: NewTodoInput) => {
    if (!projectId || !user) return null
    const now = new Date()
    const todo: Todo = {
      id: crypto.randomUUID(),
      projectId,
      title: input.title,
      status: input.status,
      priority: input.priority,
      urgency: input.urgency,
      content: input.content,
      contentFormat: input.contentFormat,
      createdAt: input.createdAt ?? now,
      updatedAt: now,
      expirationDate: input.expirationDate,
      completedAt: input.status === 'done' ? now : null,
    }
    setTodos((prev) => sortTodos([todo, ...prev], sortBy))

    const { error } = await supabase.from('todos').insert(todoInsertFromDomain(todo, user.id))
    if (error) {
      console.error(error)
      setTodos((prev) => prev.filter((t) => t.id !== todo.id))
      showToast('No se pudo crear la tarea')
      return null
    }
    return todo.id
  }, [projectId, user, showToast, sortBy])

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    const previous = todos
    const now = new Date()
    const withTimestamps: Partial<Todo> = {
      ...updates,
      updatedAt: now,
      ...(updates.status !== undefined
        ? { completedAt: updates.status === 'done' ? (updates.completedAt ?? now) : null }
        : {}),
    }
    setTodos((prev) => sortTodos(prev.map((t) => (t.id === id ? { ...t, ...withTimestamps } : t)), sortBy))

    const { error } = await supabase.from('todos').update(todoUpdateFromDomain(updates)).eq('id', id)
    if (error) {
      console.error(error)
      setTodos(previous)
      showToast('No se pudo guardar el cambio')
    }
  }, [todos, showToast, sortBy])

  const deleteTodo = useCallback(async (id: string) => {
    const previous = todos
    setTodos((prev) => prev.filter((t) => t.id !== id))

    const { error } = await supabase.from('todos').delete().eq('id', id)
    if (error) {
      console.error(error)
      setTodos(previous)
      showToast('No se pudo eliminar la tarea')
    }
  }, [todos, showToast])

  return { todos, loading, createTodo, updateTodo, deleteTodo, reload: loadTodos }
}

export function useEpics() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [epics, setEpics] = useState<Epic[]>([])
  const [loading, setLoading] = useState(true)

  const loadEpics = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase.from('epics').select('*').order('name')
    if (error) {
      console.error(error)
      showToast('No se pudieron cargar las épicas')
      setLoading(false)
      return
    }
    setEpics((data ?? []).map(mapEpic))
    setLoading(false)
  }, [user, showToast])

  useEffect(() => {
    loadEpics()
  }, [loadEpics])

  const createEpic = useCallback(async (name: string, colorCode: string) => {
    if (!user) return null
    const optimistic: Epic = { id: crypto.randomUUID(), name, colorCode, createdAt: new Date() }
    setEpics((prev) => [...prev, optimistic].sort((a, b) => a.name.localeCompare(b.name)))

    const { error } = await supabase.from('epics').insert({
      id: optimistic.id,
      user_id: user.id,
      name,
      color_code: colorCode,
    })
    if (error) {
      console.error(error)
      setEpics((prev) => prev.filter((e) => e.id !== optimistic.id))
      showToast('No se pudo crear la épica')
      return null
    }
    return optimistic.id
  }, [user, showToast])

  const updateEpic = useCallback(async (id: string, updates: Partial<Pick<Epic, 'name' | 'colorCode'>>) => {
    const previous = epics
    setEpics((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)))

    const { error } = await supabase.from('epics').update({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.colorCode !== undefined ? { color_code: updates.colorCode } : {}),
    }).eq('id', id)
    if (error) {
      console.error(error)
      setEpics(previous)
      showToast('No se pudo actualizar la épica')
    }
  }, [epics, showToast])

  const deleteEpic = useCallback(async (id: string) => {
    const previous = epics
    setEpics((prev) => prev.filter((e) => e.id !== id))

    const { error } = await supabase.from('epics').delete().eq('id', id)
    if (error) {
      console.error(error)
      setEpics(previous)
      showToast('No se pudo eliminar la épica (¿tiene proyectos?)')
    }
  }, [epics, showToast])

  return { epics, loading, createEpic, updateEpic, deleteEpic, reload: loadEpics }
}

export function useProjectTags(projectId: string | undefined) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const loadTags = useCallback(async () => {
    if (!projectId || !user) {
      setTags([])
      setLoading(false)
      return
    }
    const { data, error } = await supabase.from('tags').select('*').eq('project_id', projectId).order('name')
    if (error) {
      console.error(error)
      showToast('No se pudieron cargar los tags')
      setLoading(false)
      return
    }
    setTags((data ?? []).map(mapTag))
    setLoading(false)
  }, [projectId, user, showToast])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  const createTag = useCallback(async (name: string, color?: TagColor) => {
    if (!projectId || !user || !name.trim()) return
    const optimistic: Tag = { id: crypto.randomUUID(), projectId, name: name.trim(), color }
    setTags((prev) => [...prev, optimistic].sort((a, b) => a.name.localeCompare(b.name)))

    const { error } = await supabase.from('tags').insert({
      id: optimistic.id,
      user_id: user.id,
      project_id: projectId,
      name: optimistic.name,
      color_code: color ?? null,
    })
    if (error) {
      console.error(error)
      setTags((prev) => prev.filter((t) => t.id !== optimistic.id))
      showToast('No se pudo crear el tag')
    }
  }, [projectId, user, showToast])

  const updateTag = useCallback(async (id: string, updates: Partial<Tag>) => {
    const previous = tags
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))

    const { error } = await supabase.from('tags').update({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.color !== undefined ? { color_code: updates.color ?? null } : {}),
    }).eq('id', id)
    if (error) {
      console.error(error)
      setTags(previous)
      showToast('No se pudo actualizar el tag')
    }
  }, [tags, showToast])

  const deleteTag = useCallback(async (id: string) => {
    const previous = tags
    setTags((prev) => prev.filter((t) => t.id !== id))

    const { error } = await supabase.from('tags').delete().eq('id', id)
    if (error) {
      console.error(error)
      setTags(previous)
      showToast('No se pudo eliminar el tag')
    }
  }, [tags, showToast])

  return { tags, loading, createTag, updateTag, deleteTag, reload: loadTags }
}
