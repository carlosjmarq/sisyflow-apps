import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  ColorPicker,
  ConfirmDialog,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  Select,
  TextField,
  TruncatedTooltip,
} from './ui'
import { PROJECT_STATUS_LABELS, type Project, type ProjectStatus } from '../types'
import type { ProjectUpdatableFields } from '../data/mappers'

const STATUS_BADGES: Record<ProjectStatus, string> = {
  active: 'bg-secondary-container text-on-secondary-container',
  paused: 'bg-tertiary-container text-on-tertiary-container',
  completed: 'bg-surface-container-highest text-on-surface-variant',
}

export function ProjectCard({
  project,
  onDelete,
  onUpdate,
}: {
  project: Project
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: ProjectUpdatableFields) => void
}) {
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const color = project.color
  const todoCount = project.todoCount ?? 0
  const doneCount = project.doneCount ?? 0
  const progress = todoCount > 0 ? Math.round((doneCount / todoCount) * 100) : 0
  const isInactive = project.status !== 'active'

  return (
    <>
      <Card
        variant="elevated"
        interactive
        className={`group relative flex min-h-[180px] flex-col gap-4 p-5 ${isInactive ? 'opacity-75' : ''}`}
        onClick={() => navigate(`/project/${project.id}`)}
      >
        <div className="flex items-start justify-between">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-md"
            style={{ backgroundColor: `${color}2E`, color }}
          >
            <Icon name="folder" size={24} filled />
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <IconButton
              icon="edit"
              label="Editar proyecto"
              size="sm"
              onClick={(event) => {
                event.stopPropagation()
                setEditOpen(true)
              }}
            />
            <IconButton
              icon="delete"
              label="Eliminar proyecto"
              size="sm"
              className="hover:text-error"
              onClick={(event) => {
                event.stopPropagation()
                setDeleteOpen(true)
              }}
            />
          </div>
        </div>

        <div className="flex-1">
          <TruncatedTooltip content={project.name}>
            <h3 className="truncate text-title-medium text-on-surface">{project.name}</h3>
          </TruncatedTooltip>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {project.epic && (
              <span className="flex items-center gap-1.5 rounded-full bg-surface-container px-2 py-0.5 text-label-small text-on-surface-variant">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: project.epic.colorCode }}
                />
                {project.epic.name}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-label-small ${STATUS_BADGES[project.status]}`}>
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-label-medium text-on-surface-variant">
            <Icon name="check_circle" size={16} />
            <span>
              {doneCount}/{todoCount} completados
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1 w-full overflow-hidden rounded-full bg-on-surface/[0.08]"
          >
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-emphasized-decelerate"
              style={{ width: `${progress}%`, backgroundColor: color }}
            />
          </div>
        </div>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogTitle>Editar proyecto</DialogTitle>
          <EditProjectForm
            project={project}
            onSave={(name, nextColor, status) => {
              onUpdate(project.id, { name, color: nextColor, status })
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
        description={`Se eliminará el proyecto "${project.name}" y todas sus tareas. Esta acción no se puede deshacer.`}
        onConfirm={() => onDelete(project.id)}
      />
    </>
  )
}

function EditProjectForm({
  project,
  onSave,
  onCancel,
}: {
  project: Project
  onSave: (name: string, color: string, status: ProjectStatus) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(project.name)
  const [color, setColor] = useState(project.color)
  const [status, setStatus] = useState<ProjectStatus>(project.status)

  return (
    <div className="mt-4 flex flex-col gap-4">
      <TextField
        label="Nombre"
        labelBgClass="bg-surface-container-high"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Select
        label="Estado"
        labelBgClass="bg-surface-container-high"
        options={Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        value={status}
        onChange={(value) => setStatus(value as ProjectStatus)}
      />
      <ColorPicker value={color} onChange={setColor} />
      <DialogActions>
        <Button variant="text" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="filled" onClick={() => name.trim() && onSave(name.trim(), color, status)}>
          Guardar
        </Button>
      </DialogActions>
    </div>
  )
}
