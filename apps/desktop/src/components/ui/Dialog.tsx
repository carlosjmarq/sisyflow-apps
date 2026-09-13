import * as DialogPrimitive from '@radix-ui/react-dialog'

export function Dialog({ children, ...props }: DialogPrimitive.DialogProps) {
  return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>
}

export function DialogTrigger({ children, ...props }: DialogPrimitive.DialogTriggerProps) {
  return <DialogPrimitive.Trigger asChild {...props}>{children}</DialogPrimitive.Trigger>
}

export function DialogPortal({ children, ...props }: DialogPrimitive.DialogPortalProps) {
  return <DialogPrimitive.Portal {...props}>{children}</DialogPrimitive.Portal>
}

export function DialogOverlay({ className = '', ...props }: DialogPrimitive.DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      className={`fixed inset-0 z-40 bg-nintendo-text/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ${className}`}
      {...props}
    />
  )
}

export function DialogContent({
  className = '',
  children,
  ...props
}: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={`fixed z-50 bg-nintendo-card rounded-3xl shadow-soft-lg border border-nintendo-border/60 p-6 w-[90vw] max-w-md max-h-[85vh] overflow-auto left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${className}`}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export function DialogTitle({ className = '', ...props }: DialogPrimitive.DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      className={`text-lg font-bold text-nintendo-text ${className}`}
      {...props}
    />
  )
}

export function DialogDescription({
  className = '',
  ...props
}: DialogPrimitive.DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      className={`text-sm text-nintendo-muted ${className}`}
      {...props}
    />
  )
}

export function DialogClose({ children, ...props }: DialogPrimitive.DialogCloseProps) {
  return <DialogPrimitive.Close asChild {...props}>{children}</DialogPrimitive.Close>
}
