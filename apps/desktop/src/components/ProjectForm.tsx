import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, Dialog, DialogContent, DialogTitle, Input, Select } from './ui'
import { PROJECT_COLORS } from '../types'
import { useEpics } from '../hooks/useProjects'

export function ProjectForm({ open, onOpenChange, onCreate }: {
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
        <div className="flex flex-col gap-4 mt-4">
          <Input
            label="Nombre del proyecto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mi proyecto..."
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
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

          <div className="flex flex-col gap-1.5">
            {epics.length > 0 ? (
              <Select
                label="Épica"
                placeholder="Elegir épica..."
                options={epics.map((e) => ({ value: e.id, label: e.name }))}
                value={epicId || undefined}
                onChange={setEpicId}
              />
            ) : (
              <p className="text-xs text-nintendo-muted">
                Este proyecto necesita una épica. Creá la primera.
              </p>
            )}

            {!creatingEpic ? (
              <button
                type="button"
                onClick={() => setCreatingEpic(true)}
                className="flex items-center gap-1 self-start text-xs font-medium text-nintendo-muted hover:text-nintendo-text transition-colors px-2 py-1 rounded-lg hover:bg-nintendo-bg"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva épica
              </button>
            ) : (
              <div className="bg-nintendo-bg rounded-2xl p-3 flex flex-col gap-3">
                <Input
                  label="Nombre de la épica"
                  value={epicName}
                  onChange={(e) => setEpicName(e.target.value)}
                  placeholder="Salud, Carrera, Inglés..."
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateEpic()}
                />
                <div className="flex gap-1.5">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setEpicColor(c.bg)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${
                        epicColor === c.bg ? 'border-nintendo-text scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.bg }}
                    />
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setCreatingEpic(false)}>
                    Cancelar
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleCreateEpic} disabled={!epicName.trim()}>
                    Crear épica
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreate} disabled={!name.trim() || !epicId}>
              Crear proyecto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
