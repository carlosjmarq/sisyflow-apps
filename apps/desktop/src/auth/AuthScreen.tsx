import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Card, Icon, SegmentedButton, TextField } from '../components/ui'
import { AUTH_CALLBACK_URL } from './authCallback'

type Mode = 'login' | 'register'

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos.',
  'User already registered': 'Ese email ya está registrado.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  'Email not confirmed': 'Tu cuenta todavía no está confirmada.',
  'Email rate limit exceeded':
    'Se alcanzó el límite de correos por hora de Supabase. Esperá unos minutos y reintentá.',
}

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [canResend, setCanResend] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim() || password.length < 6) {
      setError('Ingresá un email y una contraseña de al menos 6 caracteres.')
      return
    }
    setSubmitting(true)
    setError(null)
    setNotice(null)
    setCanResend(false)

    const credentials = { email: email.trim(), password }
    const { data, error: authError } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp({
            ...credentials,
            options: { emailRedirectTo: AUTH_CALLBACK_URL },
          })

    if (authError) {
      setError(ERROR_MESSAGES[authError.message] ?? authError.message)
      setCanResend(authError.message === 'Email not confirmed')
      setSubmitting(false)
      return
    }

    if (mode === 'register' && !data.session) {
      setNotice(
        'Cuenta creada. Te enviamos un correo: abrilo en esta computadora y el enlace confirmará tu cuenta automáticamente en la app.',
      )
      setMode('login')
      setSubmitting(false)
      return
    }

    // Con sesión activa, AuthProvider monta la app automáticamente.
    setSubmitting(false)
  }

  const handleResend = async () => {
    if (!email.trim()) return
    setResending(true)
    setError(null)
    setNotice(null)
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: AUTH_CALLBACK_URL },
    })
    setResending(false)
    if (resendError) {
      setError(ERROR_MESSAGES[resendError.message] ?? resendError.message)
      return
    }
    setNotice(
      'Te reenviamos el correo de confirmación. Abrilo en esta computadora para confirmar la cuenta.',
    )
  }

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-surface px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-container opacity-50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary-container opacity-50 blur-3xl"
      />

      <Card variant="elevated" className="relative w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
            <Icon name="landscape" size={30} filled />
          </div>
          <h1 className="text-headline-small text-on-surface">SisyFlow</h1>
          <p className="text-center text-body-small text-on-surface-variant">
            Tus áreas de vida, proyectos y rachas diarias
          </p>
        </div>

        <div className="mb-5 flex justify-center">
          <SegmentedButton
            options={[
              { value: 'login', label: 'Iniciar sesión' },
              { value: 'register', label: 'Crear cuenta' },
            ]}
            value={mode}
            onChange={(value) => {
              setMode(value as Mode)
              setError(null)
              setNotice(null)
              setCanResend(false)
            }}
          />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Email"
            labelBgClass="bg-surface-container-low"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoFocus
            autoComplete="email"
          />
          <TextField
            label="Contraseña"
            labelBgClass="bg-surface-container-low"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {error && (
            <div className="flex flex-col gap-2">
              <p className="text-body-small text-error">{error}</p>
              {canResend && (
                <Button
                  type="button"
                  variant="text"
                  size="sm"
                  className="self-start"
                  disabled={resending}
                  onClick={() => void handleResend()}
                >
                  {resending ? 'Enviando…' : 'Reenviar correo de confirmación'}
                </Button>
              )}
            </div>
          )}
          {notice && <p className="text-body-small text-primary">{notice}</p>}

          <Button type="submit" variant="filled" className="w-full" disabled={submitting}>
            {submitting ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
