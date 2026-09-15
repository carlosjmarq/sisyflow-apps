import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/ui/ToastContext'
import { processAuthCallback } from './authCallback'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const bridge = window.sisyflow
    if (!bridge) return
    let disposed = false

    const handleCallback = async (url: string) => {
      const result = await processAuthCallback(url)
      if (disposed) return
      if (result.ok) {
        showToast('Cuenta confirmada. ¡Bienvenido!', 'success')
      } else {
        showToast(result.message)
      }
    }

    const unsubscribe = bridge.onAuthCallback((url) => {
      void handleCallback(url)
    })
    bridge.signalAuthReady()

    return () => {
      disposed = true
      unsubscribe()
    }
  }, [showToast])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, loading, signOut }),
    [session, loading, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
