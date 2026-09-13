import { Routes, Route } from 'react-router-dom'
import { Plus, FolderOpen, ArrowUpDown, Download, Upload } from 'lucide-react'
import { useProjects } from './hooks/useProjects'
import { ProjectCard } from './components/ProjectCard'
import { ProjectForm } from './components/ProjectForm'
import { TodoList } from './components/TodoList'
import { Button, Select, ConfirmDialog, Dialog, DialogContent, DialogTitle, DialogDescription } from './components/ui'
import { useState, useMemo, useRef } from 'react'
import type { ProjectSortKey } from './types'
import { PROJECT_SORT_OPTIONS } from './types'
import { exportBackup, importBackup } from './db/backup'

function Home() {
  const [formOpen, setFormOpen] = useState(false)
  const [sortBy, setSortBy] = useState<ProjectSortKey>('createdAt')
  const { projects, loading, createProject, deleteProject } = useProjects()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<File | null>(null)
  const [importError, setImportError] = useState(false)

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPendingImport(file)
    e.target.value = ''
  }

  const confirmImport = async () => {
    if (!pendingImport) return
    try {
      await importBackup(pendingImport)
      window.location.reload()
    } catch {
      setImportError(true)
    }
  }

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [projects, sortBy])

  return (
    <div className="h-full flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-nintendo-text">SisyFlow</h1>
          <p className="text-sm text-nintendo-muted mt-0.5">Tareas, proyectos y rachas diarias</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportBackup()}
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
        <Select
          icon={<ArrowUpDown className="w-3.5 h-3.5" />}
          options={PROJECT_SORT_OPTIONS}
          value={sortBy}
          onChange={(v) => setSortBy(v as ProjectSortKey)}
        />
      </div>

      <div className="flex-1 overflow-auto px-8 pb-8">
        {loading ? (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={deleteProject}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreate={createProject}
      />

      <ConfirmDialog
        open={pendingImport != null}
        onOpenChange={(open) => { if (!open) setPendingImport(null) }}
        title="Restaurar backup"
        description={`Se reemplazaran todos los proyectos y tareas actuales con el contenido de "${pendingImport?.name}". Esta accion no se puede deshacer.`}
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
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:projectId" element={<TodoList />} />
      </Routes>
    </div>
  )
}
