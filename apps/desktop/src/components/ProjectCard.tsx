import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, Trash2, Edit3, CheckSquare } from 'lucide-react'
import { Card, Button, ConfirmDialog, Dialog, DialogContent, DialogTitle, Input, Select, Tooltip } from './ui'
import { PROJECT_COLORS, PROJECT_STATUS_LABELS, type Project, type ProjectStatus } from '../types'
import type { ProjectUpdatableFields } from '../data/mappers'

const STATUS_BADGES: Record<ProjectStatus, string> = {
  active: 'bg-mint/60 text-nintendo-text',
  paused: 'bg-butter/70 text-nintendo-text',
  completed: 'bg-nintendo-muted/20 text-nintendo-muted',
}

export function ProjectCard({ project, onDelete, onUpdate }: {
  project: Project
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: ProjectUpdatableFields) => void
}) {
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const bgColor = project.color || PROJECT_COLORS[0].bg
  const todoCount = project.todoCount ?? 0
  const doneCount = project.doneCount ?? 0
  const isInactive = project.status !== 'active'

  return (
    <>
      <Card
        hoverable
        color={bgColor}
        className={`p-6 flex flex-col gap-4 min-h-[180px] relative group ${isInactive ? 'opacity-70' : ''}`}
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

        <div className="flex-1 flex flex-col gap-1.5">
          <Tooltip content={project.name}>
            <h3 className="font-bold text-lg text-nintendo-text truncate">{project.name}</h3>
          </Tooltip>
          <div className="flex items-center gap-1.5 flex-wrap">
            {project.epic && (
              <span className="flex items-center gap-1.5 text-[10px] text-nintendo-text/60 bg-white/40 px-2 py-0.5 rounded-full">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: project.epic.colorCode }}
                />
                {project.epic.name}
              </span>
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_BADGES[project.status]}`}>
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
          </div>
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
            initialStatus={project.status}
            onSave={(name, color, status) => {
              onUpdate(project.id, { name, color, status })
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
        onConfirm={() => onDelete(project.id)}
      />
    </>
  )
}

function EditProjectForm({ initialName, initialColor, initialStatus, onSave, onCancel }: {
  initialName: string
  initialColor: string
  initialStatus: ProjectStatus
  onSave: (name: string, color: string, status: ProjectStatus) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)
  const [status, setStatus] = useState<ProjectStatus>(initialStatus)

  return (
    <div className="flex flex-col gap-4 mt-4">
      <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
      <Select
        label="Estado"
        options={Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        value={status}
        onChange={(value) => setStatus(value as ProjectStatus)}
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
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" onClick={() => name.trim() && onSave(name.trim(), color, status)}>
          Guardar
        </Button>
      </div>
    </div>
  )
}
