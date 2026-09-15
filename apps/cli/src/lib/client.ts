import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase.js'
import { getEnv } from './env.js'
import { fail } from './errors.js'
import { clearSessionData, isExpired, loadStoredSession, saveSessionData } from './session.js'

let client: SupabaseClient<Database> | null = null

export function getClient(): SupabaseClient<Database> {
  if (client) return client
  const { url, publishableKey } = getEnv()
  client = createClient<Database>(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
  return client
}

export interface SessionOptions {
  email?: string
  password?: string
}

export async function requireSession(opts: SessionOptions = {}): Promise<Session> {
  const supabase = getClient()

  if (opts.email && opts.password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: opts.email,
      password: opts.password,
    })
    if (error) fail(`No se pudo iniciar sesión: ${error.message}`)
    saveSessionData(data.session)
    return data.session
  }

  const stored = loadStoredSession()
  if (stored) {
    const { error: setError } = await supabase.auth.setSession({
      access_token: stored.access_token,
      refresh_token: stored.refresh_token,
    })
    if (!setError) {
      const { data } = await supabase.auth.getSession()
      const session = data.session
      if (session) {
        if (!isExpired(session.expires_at ?? null)) return session
        const { data: refreshed, error } = await supabase.auth.refreshSession()
        if (!error && refreshed.session) {
          saveSessionData(refreshed.session)
          return refreshed.session
        }
        clearSessionData()
        fail('La sesión guardada expiró y no se pudo renovar. Vuelve a ejecutar `sisyflow login`.')
      }
    }
    clearSessionData()
  }

  const envEmail = process.env.SISYFLOW_EMAIL
  const envPassword = process.env.SISYFLOW_PASSWORD
  if (envEmail && envPassword) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: envEmail,
      password: envPassword,
    })
    if (error) fail(`No se pudo iniciar sesión: ${error.message}`)
    saveSessionData(data.session)
    return data.session
  }

  fail(
    'No hay sesión activa. Ejecuta `sisyflow login` o pasa --email/--password ' +
      '(o define SISYFLOW_EMAIL/SISYFLOW_PASSWORD) para usar el CLI desde scripts.',
  )
}