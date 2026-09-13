import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Database, RefreshCw } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Button, Card, ConfirmDialog } from './ui'
import { useToast } from './ui/ToastContext'
import {
  getLocalSummary,
  getMigrationMarker,
  migrateLocalData,
  type LocalSummary,
  type MigrationReport,
} from '../migration/sisifo'

export function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [summary, setSummary] = useState<LocalSummary | null>(null)
  const [marker, setMarker] = useState<string | null>(() => getMigrationMarker())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState('')
  const [report, setReport] = useState<MigrationReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await getLocalSummary())
    } catch {
      setSummary(null)
    }
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const localTotal = summary ? summary.projects + summary.todos + summary.epics + summary.tags : 0
  const canMigrate = !running && !marker && localTotal > 0 && user != null

  const runMigration = async () => {
    if (!user) return
    setRunning(true)
    setError(null)
    setReport(null)
    try {
      const result = await migrateLocalData(user.id, setStep)
      setReport(result)
      setMarker(getMigrationMarker())
      showToast('Migración completada', 'success')
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Error inesperado durante la migración')
    } finally {
      setRunning(false)
      setStep('')
    }
  }

  return (
    <div className="h-full flex flex-col overflow-auto">
      <header className="px-8 py-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl hover:bg-white/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-nintendo-text/60" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-nintendo-text">Configuración</h1>
          <p className="text-sm text-nintendo-muted">Cuenta y datos locales</p>
        </div>
      </header>

      <div className="px-8 pb-8 flex flex-col gap-4 max-w-2xl">
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-nintendo-muted" />
            <h2 className="font-bold text-nintendo-text">Migración de datos locales</h2>
          </div>
          <p className="text-sm text-nintendo-muted leading-relaxed">
            Copia las tareas, proyectos y épicas guardados en este equipo (IndexedDB) a
            Supabase. Es un proceso de una sola vez; los datos locales no se borran.
          </p>

          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Proyectos', value: summary?.projects },
              { label: 'Tareas', value: summary?.todos },
              { label: 'Épicas', value: summary?.epics },
              { label: 'Tags', value: summary?.tags },
            ].map((item) => (
              <div key={item.label} className="bg-nintendo-bg rounded-2xl py-3">
                <div className="text-lg font-bold text-nintendo-text">
                  {summary ? item.value : '—'}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-nintendo-muted">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {marker && (
            <p className="text-xs text-mint-dark font-medium">
              Migración completada el {new Date(marker).toLocaleString('es-ES')}.
            </p>
          )}
          {!marker && summary && localTotal === 0 && (
            <p className="text-xs text-nintendo-muted">No hay datos locales para migrar.</p>
          )}

          {running && (
            <div className="flex items-center gap-2 text-xs text-nintendo-muted">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {step || 'Migrando…'}
            </div>
          )}

          {error && <p className="text-xs text-coral-dark font-medium">{error}</p>}

          {report && (
            <div className="bg-mint/20 rounded-2xl p-4 text-xs text-nintendo-text flex flex-col gap-1">
              <span className="font-semibold">Resultado</span>
              <span>
                {report.epics} épicas · {report.projects} proyectos · {report.todos} tareas ·{' '}
                {report.tags} tags
              </span>
              {report.contentConversions > 0 && (
                <span>{report.contentConversions} contenidos markdown convertidos a bloques.</span>
              )}
              {report.ambiguousProjects.length > 0 && (
                <span className="text-coral-dark">
                  Proyectos con varias épicas (se asignó la más antigua):{' '}
                  {report.ambiguousProjects.join(', ')}
                </span>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="primary" disabled={!canMigrate} onClick={() => setConfirmOpen(true)}>
              Migrar datos locales
            </Button>
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-2">
          <h2 className="font-bold text-nintendo-text">Cuenta</h2>
          <p className="text-sm text-nintendo-muted">
            Sesión iniciada como <span className="font-medium text-nintendo-text">{user?.email}</span>
          </p>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Migrar datos locales"
        description="Se copiarán los datos locales a Supabase. Si algo falla podés reintentar sin duplicar registros. ¿Continuar?"
        confirmLabel="Migrar"
        onConfirm={runMigration}
      />
    </div>
  )
}
