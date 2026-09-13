import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { mapTodo } from '../data/mappers'
import type { Todo } from '../types'

export function useSearchTodos(search: string) {
  const { user } = useAuth()
  const [results, setResults] = useState<Todo[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const performSearch = useCallback(async () => {
    const query = search.trim()
    if (!query || !user) {
      setResults([])
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error(error)
      setResults([])
      setLoading(false)
      return
    }
    setResults((data ?? []).map(mapTodo))
    setLoading(false)
  }, [search, user])

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
