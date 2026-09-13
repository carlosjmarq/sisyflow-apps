import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'

export function Dialog({ children, ...props }: DialogPrimitive.DialogProps) {
  return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>
}

export const DialogTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  DialogPrimitive.DialogTriggerProps
>(function DialogTrigger({ children, ...props }, ref) {
  return (
    <DialogPrimitive.Trigger ref={ref} asChild {...props}>
      {children}
    </DialogPrimitive.Trigger>
  )
})

export function DialogPortal({ children, ...props }: DialogPrimitive.DialogPortalProps) {
  return <DialogPrimitive.Portal {...props}>{children}</DialogPrimitive.Portal>
}

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogPrimitive.DialogOverlayProps
>(function DialogOverlay({ className = '', ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={`fixed inset-0 z-40 bg-nintendo-text/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ${className}`}
      {...props}
    />
  )
})

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogPrimitive.DialogContentProps
>(function DialogContent({ className = '', children, ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={`fixed z-50 bg-nintendo-card rounded-3xl shadow-soft-lg border border-nintendo-border/60 p-6 w-[90vw] max-w-md max-h-[85vh] overflow-auto left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${className}`}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  DialogPrimitive.DialogTitleProps
>(function DialogTitle({ className = '', ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={`text-lg font-bold text-nintendo-text ${className}`}
      {...props}
    />
  )
})

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  DialogPrimitive.DialogDescriptionProps
>(function DialogDescription({ className = '', ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={`text-sm text-nintendo-muted ${className}`}
      {...props}
    />
  )
})

export const DialogClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  DialogPrimitive.DialogCloseProps
>(function DialogClose({ children, ...props }, ref) {
  return (
    <DialogPrimitive.Close ref={ref} asChild {...props}>
      {children}
    </DialogPrimitive.Close>
  )
})
