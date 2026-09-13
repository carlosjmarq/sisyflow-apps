import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, Input, Button } from './ui'

export function TodoForm({ open, onOpenChange, onCreate }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (todo: {
    title: string
    status: 'todo'
    priority: 'medium'
    urgency: 'medium'
    epic: string
    content: string
    contentFormat: 'blocknote'
    createdAt: Date
    expirationDate: null
  }) => void
}) {
  const [title, setTitle] = useState('')

  const handleCreate = () => {
    if (!title.trim()) return
    onCreate({
      title: title.trim(),
      status: 'todo',
      priority: 'medium',
      urgency: 'medium',
      epic: '',
      content: '[]',
      contentFormat: 'blocknote',
      createdAt: new Date(),
      expirationDate: null,
    })
    setTitle('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Nueva tarea</DialogTitle>
        <div className="flex flex-col gap-4 mt-4">
          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre de la tarea..."
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreate} disabled={!title.trim()}>
              Crear tarea
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
