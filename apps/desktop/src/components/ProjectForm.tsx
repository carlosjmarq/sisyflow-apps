import { useEffect, useState } from 'react'
import {
  Button,
  ColorPicker,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  Select,
  TextField,
} from './ui'
import { PROJECT_COLORS } from '../types'
import { useEpics } from '../hooks/useProjects'

export function ProjectForm({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, color: string, epicId: string) => void
}) {
  const { epics, createEpic } = useEpics()
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(PROJECT_COLORS[0].bg)
  const [epicId, setEpicId] = useState('')
  const [creatingEpic, setCreatingEpic] = useState(false)
  const [epicName, setEpicName] = useState('')
  const [epicColor, setEpicColor] = useState<string>(PROJECT_COLORS[0].bg)

  useEffect(() => {
    if (!epicId && epics.length > 0) setEpicId(epics[0].id)
  }, [epics, epicId])

  useEffect(() => {
    if (!open) {
      setCreatingEpic(false)
      setEpicName('')
    }
  }, [open])

  const handleCreate = () => {
    if (!name.trim() || !epicId) return
    onCreate(name.trim(), color, epicId)
    setName('')
    setColor(PROJECT_COLORS[0].bg)
    onOpenChange(false)
  }

  const handleCreateEpic = async () => {
    if (!epicName.trim()) return
    const id = await createEpic(epicName.trim(), epicColor)
    if (id) {
      setEpicId(id)
      setCreatingEpic(false)
      setEpicName('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Nuevo proyecto</DialogTitle>
        <div className="mt-4 flex flex-col gap-4">
          <TextField
            label="Nombre del proyecto"
            labelBgClass="bg-surface-container-high"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            onKeyDown={(event) => event.key === 'Enter' && handleCreate()}
          />

          <ColorPicker value={color} onChange={setColor} />

          <div className="flex flex-col gap-2">
            {epics.length > 0 ? (
              <Select
                label="Épica"
                labelBgClass="bg-surface-container-high"
                placeholder="Elegir épica…"
                options={epics.map((epic) => ({ value: epic.id, label: epic.name }))}
                value={epicId || undefined}
                onChange={setEpicId}
              />
            ) : (
              <p className="text-body-small text-on-surface-variant">
                Este proyecto necesita una épica. Creá la primera.
              </p>
            )}

            {!creatingEpic ? (
              <button
                type="button"
                onClick={() => setCreatingEpic(true)}
                className="state-layer flex h-10 items-center gap-2 self-start rounded-full pl-3 pr-4 text-label-large text-primary"
              >
                <Icon name="add" size={18} />
                Nueva épica
              </button>
            ) : (
              <div className="flex flex-col gap-3 rounded-md bg-surface-container p-4">
                <TextField
                  label="Nombre de la épica"
                  labelBgClass="bg-surface-container"
                  value={epicName}
                  onChange={(event) => setEpicName(event.target.value)}
                  autoFocus
                  onKeyDown={(event) => event.key === 'Enter' && handleCreateEpic()}
                />
                <ColorPicker value={epicColor} onChange={setEpicColor} size="sm" ringOffsetClass="ring-offset-surface-container" />
                <div className="flex justify-end gap-2">
                  <Button variant="text" size="sm" onClick={() => setCreatingEpic(false)}>
                    Cancelar
                  </Button>
                  <Button variant="tonal" size="sm" onClick={handleCreateEpic} disabled={!epicName.trim()}>
                    Crear épica
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogActions>
            <Button variant="text" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="filled" onClick={handleCreate} disabled={!name.trim() || !epicId}>
              Crear proyecto
            </Button>
          </DialogActions>
        </div>
      </DialogContent>
    </Dialog>
  )
}
