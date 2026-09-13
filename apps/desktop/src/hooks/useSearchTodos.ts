import { useCallback, useEffect, useRef, useState } from 'react'
import type { Todo } from '../types'
import { db } from '../db/database'

export function useSearchTodos(search: string) {
  const [results, setResults] = useState<Todo[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const performSearch = useCallback(async () => {
    if (!search.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    const query = search.toLowerCase().trim()
    const data = await db.todos
      .orderBy('createdAt')
      .reverse()
      .filter((t) => t.title.toLowerCase().includes(query))
      .toArray()
    setResults(data)
    setLoading(false)
  }, [search])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      performSearch()
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [performSearch])

  return { results, loading }
}
