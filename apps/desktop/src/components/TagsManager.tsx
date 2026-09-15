import { useState } from 'react'
import {
  Button,
  ColorPicker,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  Skeleton,
  TextField,
} from './ui'
import { useProjectTags } from '../hooks/useProjects'
import { PROJECT_COLORS, paletteHex, type Tag } from '../types'

interface TagsManagerProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TagsManager({ projectId, open, onOpenChange }: TagsManagerProps) {
  const { tags, loading, createTag, updateTag, deleteTag } = useProjectTags(open ? projectId : undefined)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<string>(PROJECT_COLORS[0].bg)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState<string>(PROJECT_COLORS[0].bg)
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null)

  const handleCreate = () => {
    if (!newName.trim()) return
    void createTag(newName.trim(), newColor)
    setNewName('')
    setNewColor(PROJECT_COLORS[0].bg)
  }

  const startEditing = (tag: Tag) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color ? paletteHex(tag.color) : PROJECT_COLORS[0].bg)
  }

  const saveEditing = () => {
    if (!editingId || !editName.trim()) return
    void updateTag(editingId, { name: editName.trim(), color: editColor })
    setEditingId(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[480px]">
          <DialogTitle>Etiquetas del proyecto</DialogTitle>
          <div className="mt-4 flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : tags.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Icon name="sell" size={32} className="text-on-surface-variant/60" />
                <p className="text-body-medium text-on-surface-variant">
                  Sin etiquetas todavía
                </p>
              </div>
            ) : (
              <div className="flex max-h-[40vh] flex-col gap-2 overflow-y-auto pr-1">
                {tags.map((tag) =>
                  editingId === tag.id ? (
                    <div key={tag.id} className="flex flex-col gap-3 rounded-md bg-surface-container p-3">
                      <TextField
                        label="Nombre"
                        labelBgClass="bg-surface-container"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        autoFocus
                        onKeyDown={(event) => event.key === 'Enter' && saveEditing()}
                      />
                      <ColorPicker
                        value={editColor}
                        onChange={setEditColor}
                        size="sm"
                        ringOffsetClass="ring-offset-surface-container"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="text" size="sm" onClick={() => setEditingId(null)}>
                          Cancelar
                        </Button>
                        <Button variant="tonal" size="sm" onClick={saveEditing} disabled={!editName.trim()}>
                          Guardar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div key={tag.id} className="flex items-center gap-3 rounded-md bg-surface-container px-3 py-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: tag.color
                            ? paletteHex(tag.color)
                            : 'rgb(var(--md-outline))',
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate text-body-medium text-on-surface">
                        {tag.name}
                      </span>
                      <IconButton icon="edit" label="Editar etiqueta" size="sm" onClick={() => startEditing(tag)} />
                      <IconButton
                        icon="delete"
                        label="Eliminar etiqueta"
                        size="sm"
                        className="hover:text-error"
                        onClick={() => setDeleteTarget(tag)}
                      />
                    </div>
                  ),
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-md border border-outline-variant p-4">
              <TextField
                label="Nueva etiqueta"
                labelBgClass="bg-surface-container-high"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleCreate()}
              />
              <ColorPicker
                value={newColor}
                onChange={setNewColor}
                size="sm"
                ringOffsetClass="ring-offset-surface-container-high"
              />
              <div className="flex justify-end">
                <Button variant="tonal" size="sm" icon="add" onClick={handleCreate} disabled={!newName.trim()}>
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteTarget(null)
        }}
        title="Eliminar etiqueta"
        description={`Se eliminará la etiqueta "${deleteTarget?.name ?? ''}". Esta acción no se puede deshacer.`}
        onConfirm={() => {
          if (deleteTarget) void deleteTag(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </>
  )
}
