import { useEffect, useState } from 'react'
import { useEpics, useProjects } from '../hooks/useProjects'
import {
  Button,
  Card,
  ColorPicker,
  ConfirmDialog,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  Icon,
  IconButton,
  Skeleton,
  TextField,
} from './ui'
import { TopAppBar } from './shell/TopAppBar'
import { useToast } from './ui/ToastContext'
import { PROJECT_COLORS, type Epic } from '../types'

export function Epics() {
  const { epics, loading, createEpic, updateEpic, deleteEpic } = useEpics()
  const { projects } = useProjects()
  const { showToast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Epic | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Epic | null>(null)

  const countFor = (epicId: string) => projects.filter((project) => project.epicId === epicId).length

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteEpic(deleteTarget.id)
    setDeleteTarget(null)
  }

  const requestDelete = (epic: Epic) => {
    const count = countFor(epic.id)
    if (count > 0) {
      showToast(
        `No se puede eliminar "${epic.name}": tiene ${count} proyecto${count === 1 ? '' : 's'}. Movelos a otra épica primero.`,
      )
      return
    }
    setDeleteTarget(epic)
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <TopAppBar title="Épicas" subtitle="Tus áreas de vida continuas" />

      <div className="flex-1 overflow-y-auto px-6 pb-28 pt-2">
        <div className="mx-auto flex max-w-[800px] flex-col gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[76px] w-full rounded-md" />
            ))
          ) : epics.length === 0 ? (
            <Card variant="outlined" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <Icon name="category" size={40} className="text-on-surface-variant/60" />
              <p className="text-body-medium text-on-surface">No hay épicas todavía</p>
              <p className="text-body-small text-on-surface-variant">
                Las épicas son tus áreas de vida: Salud, Carrera, Inglés…
              </p>
            </Card>
          ) : (
            epics.map((epic) => {
              const count = countFor(epic.id)
              return (
                <Card key={epic.id} variant="elevated" className="flex items-center gap-4 px-5 py-4">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full"
                    style={{ backgroundColor: epic.colorCode }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-title-small text-on-surface">{epic.name}</p>
                    <p className="text-body-small text-on-surface-variant">
                      {count} proyecto{count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <IconButton
                    icon="edit"
                    label="Editar épica"
                    onClick={() => {
                      setEditing(epic)
                      setFormOpen(true)
                    }}
                  />
                  <IconButton
                    icon="delete"
                    label="Eliminar épica"
                    className="hover:text-error"
                    onClick={() => requestDelete(epic)}
                  />
                </Card>
              )
            })
          )}
        </div>
      </div>

      <div className="absolute bottom-6 right-6">
        <Fab
          icon="add"
          label="Nueva épica"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        />
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
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Eliminar épica"
        description={`Se eliminará la épica "${deleteTarget?.name ?? ''}". Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function EpicFormDialog({
  open,
  onOpenChange,
  epic,
  onSubmit,
}: {
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
        <div className="mt-4 flex flex-col gap-4">
          <TextField
            label="Nombre"
            labelBgClass="bg-surface-container-high"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Salud, Carrera, Inglés…"
            autoFocus
            onKeyDown={(event) => event.key === 'Enter' && submit()}
          />
          <ColorPicker value={color} onChange={setColor} />
          <DialogActions>
            <Button variant="text" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="filled" onClick={submit} disabled={!name.trim()}>
              {epic ? 'Guardar' : 'Crear épica'}
            </Button>
          </DialogActions>
        </div>
      </DialogContent>
    </Dialog>
  )
}
