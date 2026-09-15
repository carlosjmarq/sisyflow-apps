import { Dialog, DialogContent, DialogTitle, DialogDescription } from './Dialog'
import { Button } from './Button'
import { Icon } from './Icon'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  variant?: 'danger' | 'warning'
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Eliminar',
  onConfirm,
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              variant === 'danger'
                ? 'bg-error-container text-on-error-container'
                : 'bg-primary-container text-on-primary-container'
            }`}
          >
            <Icon name="warning" size={24} />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="text" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'filled'}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
