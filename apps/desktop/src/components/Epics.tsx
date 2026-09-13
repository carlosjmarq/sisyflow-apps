import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mountain, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEpics, useProjects } from '../hooks/useProjects'
import { Button, Card, ConfirmDialog, Dialog, DialogContent, DialogTitle, Input } from './ui'
import { useToast } from './ui/ToastContext'
import { PROJECT_COLORS, type Epic } from '../types'

export function Epics() {
  const navigate = useNavigate()
  const { epics, loading, createEpic, updateEpic, deleteEpic } = useEpics()
  const { projects } = useProjects()
  const { showToast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Epic | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Epic | null>(null)

  const countFor = (epicId: string) => projects.filter((p) => p.epicId === epicId).length

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteEpic(deleteTarget.id)
    setDeleteTarget(null)
  }

  const requestDelete = (epic: Epic) => {
    const count = countFor(epic.id)
    if (count > 0) {
      showToast(
        `No se puede eliminar "${epic.name}": tiene ${count} proyecto${count === 1 ? '' : 's'}. Movelos a otra épica primero.`
      )
      return
    }
    setDeleteTarget(epic)
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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-nintendo-text">Épicas</h1>
          <p className="text-sm text-nintendo-muted">Tus áreas de vida continuas</p>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus className="w-4 h-4" />
          Nueva épica
        </Button>
      </header>

      <div className="px-8 pb-8 flex flex-col gap-3 max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-12 h-12 rounded-2xl bg-lavender/40 animate-pulse" />
          </div>
        ) : epics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-nintendo-muted">
            <Mountain className="w-10 h-10 text-nintendo-muted/40" />
            <p className="text-sm">No hay épicas todavía</p>
          </div>
        ) : (
          epics.map((epic) => {
            const count = countFor(epic.id)
            return (
              <Card key={epic.id} hoverable={false} className="px-5 py-4 flex items-center gap-4">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: epic.colorCode }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-nintendo-text truncate">{epic.name}</p>
                  <p className="text-xs text-nintendo-muted">
                    {count} proyecto{count === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  onClick={() => { setEditing(epic); setFormOpen(true) }}
                  className="p-2 rounded-xl hover:bg-nintendo-bg transition-colors"
                  title="Editar épica"
                >
                  <Pencil className="w-4 h-4 text-nintendo-text/50" />
                </button>
                <button
                  onClick={() => requestDelete(epic)}
                  className="p-2 rounded-xl hover:bg-coral/40 transition-colors"
                  title="Eliminar épica"
                >
                  <Trash2 className="w-4 h-4 text-nintendo-text/50" />
                </button>
              </Card>
            )
          })
        )}
      </div>

      <EpicFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        epic={editing}
        onSubmit={async (name, colorCode) => {
          if (editing) {
            await updateEpic(editing.id, { name, colorCode })
          } else {
            await createEpic(name, colorCode)
          }
          setFormOpen(false)
        }}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Eliminar épica"
        description={`Se eliminara la épica "${deleteTarget?.name ?? ''}". Esta accion no se puede deshacer.`}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function EpicFormDialog({ open, onOpenChange, epic, onSubmit }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  epic: Epic | null
  onSubmit: (name: string, colorCode: string) => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(PROJECT_COLORS[0].bg)

  useEffect(() => {
    if (open) {
      setName(epic?.name ?? '')
      setColor(epic?.colorCode ?? PROJECT_COLORS[0].bg)
    }
  }, [open, epic])

  const submit = () => {
    if (!name.trim()) return
    onSubmit(name.trim(), color)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{epic ? 'Editar épica' : 'Nueva épica'}</DialogTitle>
        <div className="flex flex-col gap-4 mt-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Salud, Carrera, Inglés..."
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-nintendo-muted">Color</span>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.bg)}
                  className={`w-10 h-10 rounded-xl border-2 transition-all ${
                    color === c.bg ? 'border-nintendo-text scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.bg }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={submit} disabled={!name.trim()}>
              {epic ? 'Guardar' : 'Crear épica'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
