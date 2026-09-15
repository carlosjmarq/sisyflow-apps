import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Icon } from './Icon'

export const Menu = DropdownMenuPrimitive.Root
export const MenuTrigger = DropdownMenuPrimitive.Trigger
export const MenuRadioGroup = DropdownMenuPrimitive.RadioGroup

export const MenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuPrimitive.DropdownMenuContentProps
>(function MenuContent({ className = '', sideOffset = 6, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={`z-[90] min-w-[200px] max-w-[340px] overflow-hidden rounded-xs bg-surface-container py-2 shadow-elev-2 data-[state=open]:animate-menu-in ${className}`}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
})

export const MenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuPrimitive.DropdownMenuItemProps
>(function MenuItem({ className = '', ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={`flex h-12 cursor-pointer select-none items-center gap-3 px-4 text-body-large text-on-surface outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:text-on-surface/38 data-[highlighted]:bg-on-surface/[0.08] ${className}`}
      {...props}
    />
  )
})

export const MenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  DropdownMenuPrimitive.DropdownMenuRadioItemProps
>(function MenuRadioItem({ className = '', children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={`relative flex h-12 cursor-pointer select-none items-center gap-3 pl-12 pr-4 text-body-large text-on-surface outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:text-on-surface/38 data-[highlighted]:bg-on-surface/[0.08] ${className}`}
      {...props}
    >
      <span className="absolute left-4">
        <DropdownMenuPrimitive.ItemIndicator>
          <Icon name="check" size={20} className="text-primary" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
})

export function MenuLabel({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-4 py-2 text-label-medium text-on-surface-variant ${className}`} {...props} />
}

export function MenuSeparator({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={`my-2 h-px bg-outline-variant ${className}`} {...props} />
}
