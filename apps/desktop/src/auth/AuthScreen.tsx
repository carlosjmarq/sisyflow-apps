import { useState } from 'react'
import { Mountain } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button, Input } from '../components/ui'

type Mode = 'login' | 'register'

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos.',
  'User already registered': 'Ese email ya está registrado.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  'Email not confirmed': 'Tenés que confirmar tu email antes de entrar.',
}

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || password.length < 6) {
      setError('Ingresá un email y una contraseña de al menos 6 caracteres.')
      return
    }
    setSubmitting(true)
    setError(null)
    setNotice(null)

    const credentials = { email: email.trim(), password }
    const { data, error: authError } = mode === 'login'
      ? await supabase.auth.signInWithPassword(credentials)
      : await supabase.auth.signUp(credentials)

    if (authError) {
      setError(ERROR_MESSAGES[authError.message] ?? authError.message)
      setSubmitting(false)
      return
    }

    if (mode === 'register' && !data.session) {
      setNotice('Cuenta creada. Revisá tu correo para confirmarla y después iniciá sesión.')
      setMode('login')
      setSubmitting(false)
      return
    }

    // Con sesión activa, AuthProvider monta la app automáticamente.
    setSubmitting(false)
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-mint/40 via-lavender/30 to-sky/40 px-4">
      <div className="w-full max-w-sm bg-nintendo-card rounded-3xl shadow-soft-lg border border-nintendo-border/60 p-8">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-lavender/50 flex items-center justify-center">
            <Mountain className="w-7 h-7 text-nintendo-text/70" />
          </div>
          <h1 className="text-2xl font-extrabold text-nintendo-text">SisyFlow</h1>
          <p className="text-xs text-nintendo-muted text-center">
            Tus áreas de vida, proyectos y rachas diarias
          </p>
        </div>

        <div className="flex bg-nintendo-bg rounded-2xl p-1 mb-5">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setNotice(null) }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === m ? 'bg-white shadow-soft text-nintendo-text' : 'text-nintendo-muted hover:text-nintendo-text'
              }`}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoFocus
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />

          {error && <p className="text-xs text-coral-dark font-medium">{error}</p>}
          {notice && <p className="text-xs text-mint-dark font-medium">{notice}</p>}

          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </Button>
        </form>
      </div>
    </div>
  )
}
