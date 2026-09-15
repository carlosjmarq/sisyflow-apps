import { supabase } from '../lib/supabase'

export const AUTH_CALLBACK_URL = 'sisyflow://auth/callback'

export type AuthCallbackResult = { ok: true } | { ok: false; message: string }

/**
 * Procesa la URL que llega por deep link tras confirmar el correo (o recuperar
 * la contraseña). Supabase usa el flujo implícito: los tokens viajan en el hash
 * de `sisyflow://auth/callback#access_token=...&refresh_token=...` y acá se
 * establece la sesión manualmente (el cliente tiene detectSessionInUrl: false).
 */
export async function processAuthCallback(rawUrl: string): Promise<AuthCallbackResult> {
  let params: URLSearchParams
  try {
    const url = new URL(rawUrl)
    params = new URLSearchParams(url.hash ? url.hash.slice(1) : url.search)
  } catch {
    return { ok: false, message: 'No se pudo leer el enlace de autenticación.' }
  }

  const errorDescription = params.get('error_description') ?? params.get('error')
  if (errorDescription) {
    return { ok: false, message: decodeURIComponent(errorDescription.replace(/\+/g, ' ')) }
  }

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (!accessToken || !refreshToken) {
    return { ok: false, message: 'El enlace ya no es válido o venció. Pedí uno nuevo.' }
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}
