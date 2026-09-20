import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Select, TextField } from './ui'
import type { NewTodoInput } from '../hooks/useProjects'
import { RECURRENCE_LABELS, type TodoRecurrence } from '../types'

const RECURRENCE_OPTIONS = Object.entries(RECURRENCE_LABELS).map(([value, label]) => ({ value, label }))

export function TodoForm({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (todo: NewTodoInput) => void
}) {
  const [title, setTitle] = useState('')
  const [recurrence, setRecurrence] = useState<TodoRecurrence>('none')

  const handleCreate = () => {
    if (!title.trim()) return
    onCreate({
      title: title.trim(),
      status: 'todo',
      priority: 'medium',
      urgency: 'medium',
      content: '[]',
      contentFormat: 'blocknote',
      createdAt: new Date(),
      expirationDate: null,
      recurrence,
    })
    setTitle('')
    setRecurrence('none')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogTitle>Nueva tarea</DialogTitle>
        <div className="mt-4 flex flex-col gap-4">
          <TextField
            label="Título"
            labelBgClass="bg-surface-container-high"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
            onKeyDown={(event) => event.key === 'Enter' && handleCreate()}
          />
          <Select
            label="Repetición"
            labelBgClass="bg-surface-container-high"
            options={RECURRENCE_OPTIONS}
            value={recurrence}
            onChange={(value) => setRecurrence(value as TodoRecurrence)}
          />
          <DialogActions>
            <Button variant="text" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="filled" onClick={handleCreate} disabled={!title.trim()}>
              Crear tarea
            </Button>
          </DialogActions>
        </div>
      </DialogContent>
    </Dialog>
  )
}
