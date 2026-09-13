import { Routes, Route, useNavigate } from 'react-router-dom'
import { Plus, FolderOpen, ArrowUpDown, Download, Upload, Settings as SettingsIcon, LogOut, Mountain, LayoutGrid, CalendarDays } from 'lucide-react'
import { useProjects } from './hooks/useProjects'
import { useAuth } from './auth/AuthContext'
import { AuthScreen } from './auth/AuthScreen'
import { ProjectCard } from './components/ProjectCard'
import { ProjectForm } from './components/ProjectForm'
import { TodoList } from './components/TodoList'
import { Settings } from './components/Settings'
import { Epics } from './components/Epics'
import { DayView } from './components/DayView'
import { Button, Select, ConfirmDialog, Dialog, DialogContent, DialogTitle, DialogDescription } from './components/ui'
import { useToast } from './components/ui/ToastContext'
import { useState, useMemo, useRef } from 'react'
import type { Project, ProjectSortKey } from './types'
import { PROJECT_SORT_OPTIONS, DEFAULT_HEX } from './types'
import { exportBackup, importBackup } from './db/backup'

type HomeView = 'projects' | 'day'

function Home() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [sortBy, setSortBy] = useState<ProjectSortKey>('createdAt')
  const [view, setView] = useState<HomeView>('projects')
  const { projects, loading, createProject, deleteProject, updateProject } = useProjects()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<File | null>(null)
  const [importError, setImportError] = useState(false)

  const handleExport = async () => {
    try {
      await exportBackup()
    } catch (e) {
      console.error(e)
      showToast('No se pudo exportar el backup')
    }
  }

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPendingImport(file)
    e.target.value = ''
  }

  const confirmImport = async () => {
    if (!pendingImport || !user) return
    try {
      await importBackup(pendingImport, user.id)
      window.location.reload()
    } catch (e) {
      console.error(e)
      setImportError(true)
    }
  }

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [projects, sortBy])

  const projectGroups = useMemo(() => {
    const groups = new Map<string, { epic?: Project['epic']; projects: Project[] }>()
    for (const project of sortedProjects) {
      const group = groups.get(project.epicId) ?? { epic: project.epic, projects: [] }
      group.projects.push(project)
      groups.set(project.epicId, group)
    }
    return [...groups.values()].sort((a, b) => (a.epic?.name ?? '').localeCompare(b.epic?.name ?? ''))
  }, [sortedProjects])

  return (
    <div className="h-full flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-nintendo-text">SisyFlow</h1>
          <p className="text-sm text-nintendo-muted mt-0.5">Tareas, proyectos y rachas diarias</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/epics')}
            title="Épicas"
            className="p-2.5 rounded-2xl bg-white border border-nintendo-border/60 text-nintendo-muted hover:text-nintendo-text hover:border-mint-dark/70 shadow-soft hover:shadow-soft-md transition-all duration-200"
          >
            <Mountain className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            title="Configuración"
            className="p-2.5 rounded-2xl bg-white border border-nintendo-border/60 text-nintendo-muted hover:text-nintendo-text hover:border-lavender-dark/70 shadow-soft hover:shadow-soft-md transition-all duration-200"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            title="Exportar backup"
            className="p-2.5 rounded-2xl bg-white border border-nintendo-border/60 text-nintendo-muted hover:text-nintendo-text hover:border-sky-dark/70 shadow-soft hover:shadow-soft-md transition-all duration-200"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Restaurar backup"
            className="p-2.5 rounded-2xl bg-white border border-nintendo-border/60 text-nintendo-muted hover:text-nintendo-text hover:border-lavender-dark/70 shadow-soft hover:shadow-soft-md transition-all duration-200"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={() => void signOut()}
            title="Cerrar sesión"
            className="p-2.5 rounded-2xl bg-white border border-nintendo-border/60 text-nintendo-muted hover:text-coral-dark hover:border-coral-dark/70 shadow-soft hover:shadow-soft-md transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFilePicked}
          />
          <Button variant="primary" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4" />
            Nuevo proyecto
          </Button>
        </div>
      </header>

      <div className="px-8 pb-3 flex items-center gap-2">
        <div className="flex bg-nintendo-bg rounded-2xl p-1">
          {([['projects', 'Proyectos', LayoutGrid], ['day', 'Tareas del día', CalendarDays]] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => setView(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                view === value ? 'bg-white shadow-soft text-nintendo-text' : 'text-nintendo-muted hover:text-nintendo-text'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
        {view === 'projects' && (
          <Select
            icon={<ArrowUpDown className="w-3.5 h-3.5" />}
            options={PROJECT_SORT_OPTIONS}
            value={sortBy}
            onChange={(v) => setSortBy(v as ProjectSortKey)}
          />
        )}
      </div>

      <div className="flex-1 overflow-auto px-8 pb-8">
        {view === 'day' ? (
          <DayView />
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-lavender/40 animate-pulse" />
              <span className="text-nintendo-muted text-sm">Cargando proyectos...</span>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-24 h-24 rounded-3xl bg-lavender/20 flex items-center justify-center">
              <FolderOpen className="w-10 h-10 text-nintendo-muted/40" />
            </div>
            <p className="text-nintendo-muted text-sm">No hay proyectos aún</p>
            <Button variant="secondary" onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4" />
              Crear primer proyecto
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {projectGroups.map((group) => (
              <div key={group.epic?.id ?? 'sin-epica'} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: group.epic?.colorCode ?? DEFAULT_HEX }}
                  />
                  <span className="text-sm font-bold text-nintendo-text">
                    {group.epic?.name ?? 'Sin épica'}
                  </span>
                  <span className="text-[10px] text-nintendo-muted bg-nintendo-bg px-1.5 py-0.5 rounded-full">
                    {group.projects.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onDelete={deleteProject}
                      onUpdate={updateProject}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreate={(name, color, epicId) => { void createProject(name, color, epicId) }}
      />

      <ConfirmDialog
        open={pendingImport != null}
        onOpenChange={(open) => { if (!open) setPendingImport(null) }}
        title="Restaurar backup"
        description={`Se importaran los datos de "${pendingImport?.name}" a tu cuenta. Los registros con el mismo id se actualizaran; el resto no se borra.`}
        confirmLabel="Restaurar"
        onConfirm={confirmImport}
      />

      <Dialog open={importError} onOpenChange={setImportError}>
        <DialogContent>
          <DialogTitle>Error al restaurar</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed mt-2">
            No se pudo restaurar el backup. Verifica que el archivo sea un backup valido de SisyFlow.
          </DialogDescription>
          <div className="flex justify-end mt-4">
            <Button variant="secondary" onClick={() => setImportError(false)}>
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-mint/40 via-lavender/30 to-sky/40">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-lavender/50 flex items-center justify-center">
            <Mountain className="w-7 h-7 text-nintendo-text/70" />
          </div>
          <span className="text-sm text-nintendo-muted">Cargando SisyFlow…</span>
        </div>
      </div>
    )
  }

  if (!session) return <AuthScreen />

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:projectId" element={<TodoList />} />
        <Route path="/epics" element={<Epics />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  )
}
