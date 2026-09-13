import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, Trash2, Edit3, CheckSquare } from 'lucide-react'
import { Card, Button, ConfirmDialog, Dialog, DialogContent, DialogTitle, Input, Tooltip } from './ui'
import { useProjects, useProjectTodos } from '../hooks/useProjects'
import { PROJECT_COLORS } from '../types'

const COLOR_MAP: Record<string, string> = Object.fromEntries(
  PROJECT_COLORS.map((c) => [c.value, c.bg])
)

export function ProjectCard({ project, onDelete }: {
  project: { id?: number; name: string; color: string }
  onDelete: (id: number) => void
}) {
  const navigate = useNavigate()
  const { todos } = useProjectTodos(project.id)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { updateProject } = useProjects()

  const bgColor = COLOR_MAP[project.color] || '#C7F9CC'
  const todoCount = todos.length
  const doneCount = todos.filter((t) => t.status === 'done').length

  return (
    <>
      <Card
        hoverable
        color={bgColor}
        className="p-6 flex flex-col gap-4 min-h-[180px] relative group"
        onClick={() => navigate(`/project/${project.id}`)}
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-white/60 flex items-center justify-center shadow-sm">
            <Folder className="w-6 h-6 text-nintendo-text/60" />
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setEditOpen(true) }}
              className="p-2 rounded-xl hover:bg-white/60 transition-colors"
            >
              <Edit3 className="w-4 h-4 text-nintendo-text/50" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteOpen(true) }}
              className="p-2 rounded-xl hover:bg-coral/60 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-nintendo-text/50" />
            </button>
          </div>
        </div>

        <div className="flex-1">
          <Tooltip content={project.name}>
            <h3 className="font-bold text-lg text-nintendo-text truncate">{project.name}</h3>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2 text-sm text-nintendo-text/60">
          <CheckSquare className="w-4 h-4" />
          <span>{doneCount}/{todoCount} completados</span>
        </div>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogTitle>Editar proyecto</DialogTitle>
          <EditProjectForm
            initialName={project.name}
            initialColor={project.color}
            onSave={async (name, color) => {
              if (project.id != null) await updateProject(project.id, { name, color })
              setEditOpen(false)
            }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar proyecto"
        description={`Se eliminara el proyecto "${project.name}" y todas sus tareas. Esta accion no se puede deshacer.`}
        onConfirm={() => { if (project.id != null) onDelete(project.id) }}
      />
    </>
  )
}

function EditProjectForm({ initialName, initialColor, onSave, onCancel }: {
  initialName: string
  initialColor: string
  onSave: (name: string, color: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)

  return (
    <div className="flex flex-col gap-4 mt-4">
      <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
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
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" onClick={() => name.trim() && onSave(name.trim(), color)}>
          Guardar
        </Button>
      </div>
    </div>
  )
}
