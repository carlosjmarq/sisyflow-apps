import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Button, Card, ConfirmDialog, Icon, SegmentedButton, Spinner } from './ui'
import { TopAppBar } from './shell/TopAppBar'
import { useToast } from './ui/ToastContext'
import { useTheme, type ThemePreference } from '../theme/ThemeContext'
import {
  getLocalSummary,
  getMigrationMarker,
  migrateLocalData,
  type LocalSummary,
  type MigrationReport,
} from '../migration/sisifo'

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: 'light_mode' },
  { value: 'dark', label: 'Oscuro', icon: 'dark_mode' },
  { value: 'system', label: 'Sistema', icon: 'brightness_auto' },
]

export function Settings() {
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  const { preference, setPreference } = useTheme()
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
    <div className="flex h-full min-h-0 flex-col">
      <TopAppBar title="Ajustes" subtitle="Cuenta, apariencia y datos locales" />

      <div className="flex-1 overflow-y-auto px-6 pb-12 pt-2">
        <div className="mx-auto flex max-w-[720px] flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-title-medium text-on-surface">Apariencia</h2>
            <Card variant="elevated" className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <Icon name="palette" size={22} className="text-on-surface-variant" />
                <div>
                  <p className="text-body-large text-on-surface">Tema</p>
                  <p className="text-body-small text-on-surface-variant">
                    Claro, oscuro o según el sistema
                  </p>
                </div>
              </div>
              <SegmentedButton
                options={THEME_OPTIONS}
                value={preference}
                onChange={(value) => setPreference(value as ThemePreference)}
              />
            </Card>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-title-medium text-on-surface">Cuenta</h2>
            <Card variant="elevated" className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 items-center gap-3">
                <Icon name="account_circle" size={28} className="shrink-0 text-on-surface-variant" />
                <div className="min-w-0">
                  <p className="text-body-large text-on-surface">Sesión iniciada</p>
                  <p className="truncate text-body-small text-on-surface-variant">{user?.email}</p>
                </div>
              </div>
              <Button variant="outlined" icon="logout" onClick={() => void signOut()}>
                Cerrar sesión
              </Button>
            </Card>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-title-medium text-on-surface">Datos locales</h2>
            <Card variant="elevated" className="flex flex-col gap-4 p-5">
              <div className="flex items-center gap-3">
                <Icon name="database" size={22} className="text-on-surface-variant" />
                <div>
                  <p className="text-body-large text-on-surface">Migración de datos locales</p>
                  <p className="text-body-small text-on-surface-variant">
                    Copia los datos guardados en este equipo (IndexedDB) a Supabase. Es un proceso
                    de una sola vez; los datos locales no se borran.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Proyectos', value: summary?.projects },
                  { label: 'Tareas', value: summary?.todos },
                  { label: 'Épicas', value: summary?.epics },
                  { label: 'Etiquetas', value: summary?.tags },
                ].map((item) => (
                  <div key={item.label} className="rounded-md bg-surface-container py-3">
                    <div className="text-title-medium tabular-nums text-on-surface">
                      {summary ? item.value : '—'}
                    </div>
                    <div className="text-label-small text-on-surface-variant">{item.label}</div>
                  </div>
                ))}
              </div>

              {marker && (
                <p className="flex items-center gap-2 text-body-small text-primary">
                  <Icon name="check_circle" size={16} />
                  Migración completada el {new Date(marker).toLocaleString('es-ES')}.
                </p>
              )}
              {!marker && summary && localTotal === 0 && (
                <p className="text-body-small text-on-surface-variant">
                  No hay datos locales para migrar.
                </p>
              )}

              {running && (
                <div className="flex items-center gap-3 text-body-small text-on-surface-variant">
                  <Spinner size={18} />
                  {step || 'Migrando…'}
                </div>
              )}

              {error && <p className="text-body-small text-error">{error}</p>}

              {report && (
                <div className="flex flex-col gap-1 rounded-md bg-secondary-container p-4 text-body-small text-on-secondary-container">
                  <span className="text-label-large">Resultado</span>
                  <span>
                    {report.epics} épicas · {report.projects} proyectos · {report.todos} tareas ·{' '}
                    {report.tags} etiquetas
                  </span>
                  {report.contentConversions > 0 && (
                    <span>{report.contentConversions} contenidos markdown convertidos a bloques.</span>
                  )}
                  {report.ambiguousProjects.length > 0 && (
                    <span>
                      Proyectos con varias épicas (se asignó la más antigua):{' '}
                      {report.ambiguousProjects.join(', ')}
                    </span>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="tonal" disabled={!canMigrate} onClick={() => setConfirmOpen(true)}>
                  Migrar datos locales
                </Button>
              </div>
            </Card>
          </section>
        </div>
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
