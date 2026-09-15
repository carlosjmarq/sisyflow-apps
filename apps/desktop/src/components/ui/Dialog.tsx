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
      className={`fixed inset-0 z-40 bg-scrim/32 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out ${className}`}
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
        className={`fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-[560px] -translate-x-1/2 -translate-y-1/2 focus:outline-none data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out ${className}`}
        {...props}
      >
        <div className="max-h-[85vh] overflow-y-auto rounded-xl bg-surface-container-high p-6 shadow-elev-3">
          {children}
        </div>
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
      className={`text-headline-small text-on-surface ${className}`}
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
      className={`text-body-medium text-on-surface-variant ${className}`}
      {...props}
    />
  )
})

export function DialogActions({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mt-6 flex justify-end gap-2 ${className}`} {...props} />
}

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
