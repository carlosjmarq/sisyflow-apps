import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, Input, Button } from './ui'
import { PROJECT_COLORS } from '../types'

export function ProjectForm({ open, onOpenChange, onCreate }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, color: string) => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('mint')

  const handleCreate = () => {
    if (!name.trim()) return
    onCreate(name.trim(), color)
    setName('')
    setColor('mint')
    onOpenChange(false)
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
                  onClick={() => setColor(c.value)}
                  className={`w-10 h-10 rounded-xl border-2 transition-all ${
                    color === c.value ? 'border-nintendo-text scale-110' : 'border-transparent'
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
            <Button variant="primary" onClick={handleCreate} disabled={!name.trim()}>
              Crear proyecto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
