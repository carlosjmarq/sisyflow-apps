import { useCallback, useEffect, useState } from 'react'
import type { Project, Todo, Epic, Tag, TagColor, TodoSortKey } from '../types'
import { db } from '../db/database'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const loadProjects = useCallback(async () => {
    const all = await db.projects.orderBy('createdAt').reverse().toArray()
    setProjects(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const createProject = useCallback(async (name: string, color: string) => {
    const id = await db.projects.add({
      name,
      color,
      createdAt: new Date(),
    })
    await loadProjects()
    return id
  }, [loadProjects])

  const updateProject = useCallback(async (id: number, updates: Partial<Project>) => {
    await db.projects.update(id, updates)
    await loadProjects()
  }, [loadProjects])

  const deleteProject = useCallback(async (id: number) => {
    await db.todos.where('projectId').equals(id).delete()
    await db.epics.where('projectId').equals(id).delete()
    await db.tags.where('projectId').equals(id).delete()
    await db.projects.delete(id)
    await loadProjects()
  }, [loadProjects])

  return { projects, loading, createProject, updateProject, deleteProject }
}

export function useProjectTodos(projectId: number | undefined, sortBy: TodoSortKey = 'createdAt') {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  const loadTodos = useCallback(async () => {
    if (projectId == null) {
      setTodos([])
      setLoading(false)
      return
    }
    const all = await db.todos
      .where('projectId')
      .equals(projectId)
      .toArray()

    const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
    const statusOrder: Record<string, number> = { 'todo': 1, 'in-progress': 2, 'backlog': 3, 'done': 4, 'cancelled': 5 }

    const sorted = [...all].sort((a, b) => {
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
    setTodos(sorted)
    setLoading(false)
  }, [projectId, sortBy])

  useEffect(() => {
    setLoading(true)
    loadTodos()
  }, [loadTodos])

  const createTodo = useCallback(async (todo: Omit<Todo, 'id'>) => {
    const id = await db.todos.add({ ...todo, updatedAt: new Date() } as Todo)
    await loadTodos()
    return id
  }, [loadTodos])

  const updateTodo = useCallback(async (id: number, updates: Partial<Todo>) => {
    await db.todos.update(id, { ...updates, updatedAt: new Date() })
    await loadTodos()
  }, [loadTodos])

  const deleteTodo = useCallback(async (id: number) => {
    await db.todos.delete(id)
    await loadTodos()
  }, [loadTodos])

  return { todos, loading, createTodo, updateTodo, deleteTodo, reload: loadTodos }
}

export function useProjectEpics(projectId: number | undefined) {
  const [epics, setEpics] = useState<Epic[]>([])

  const loadEpics = useCallback(async () => {
    if (projectId == null) {
      setEpics([])
      return
    }
    const all = await db.epics
      .where('projectId')
      .equals(projectId)
      .sortBy('name')
    setEpics(all)
  }, [projectId])

  useEffect(() => {
    loadEpics()
  }, [loadEpics])

  const ensureEpic = useCallback(async (name: string) => {
    if (!name.trim() || projectId == null) return
    const existing = await db.epics
      .where({ projectId, name: name.trim() })
      .first()
    if (!existing) {
      await db.epics.add({ projectId, name: name.trim() })
      await loadEpics()
    }
  }, [projectId, loadEpics])

  return { epics, ensureEpic, reload: loadEpics }
}

export function useProjectTags(projectId: number | undefined) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const loadTags = useCallback(async () => {
    if (projectId == null) {
      setTags([])
      setLoading(false)
      return
    }
    const all = await db.tags
      .where('projectId')
      .equals(projectId)
      .sortBy('name')
    setTags(all)
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  const createTag = useCallback(async (name: string, color?: TagColor) => {
    if (!name.trim() || projectId == null) return
    const existing = await db.tags
      .where({ projectId, name: name.trim() })
      .first()
    if (existing) return
    await db.tags.add({ projectId, name: name.trim(), color })
    await loadTags()
  }, [projectId, loadTags])

  const updateTag = useCallback(async (id: number, updates: Partial<Tag>) => {
    await db.tags.update(id, updates)
    await loadTags()
  }, [loadTags])

  const deleteTag = useCallback(async (id: number) => {
    await db.tags.delete(id)
    await loadTags()
  }, [loadTags])

  return { tags, loading, createTag, updateTag, deleteTag, reload: loadTags }
}
