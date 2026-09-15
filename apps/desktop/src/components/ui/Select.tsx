import { useState } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Icon } from './Icon'

interface SelectOption {
  value: string
  label: string
  icon?: string
}

interface SelectProps {
  label?: string
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  icon?: string
  labelBgClass?: string
  className?: string
  disabled?: boolean
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar…',
  icon,
  labelBgClass = 'bg-surface',
  className = '',
  disabled = false,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const floated = open || (value !== undefined && value !== '')

  return (
    <div className={`relative w-full ${className}`}>
      <SelectPrimitive.Root
        value={value}
        onValueChange={onChange}
        onOpenChange={setOpen}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          className={[
            'state-layer flex h-14 w-full items-center gap-2 rounded-xs border bg-transparent pl-4 pr-10 text-left text-body-large outline-none',
            'transition-[border-color,box-shadow] duration-150',
            open
              ? 'border-primary shadow-[inset_0_0_0_1px_rgb(var(--md-primary))]'
              : 'border-outline',
            disabled ? 'border-on-surface/12 text-on-surface/38' : 'text-on-surface',
          ].join(' ')}
        >
          {icon && <Icon name={icon} size={20} className="text-on-surface-variant" />}
          <span className="min-w-0 flex-1 truncate">
            <SelectPrimitive.Value placeholder={placeholder} />
          </span>
          <Icon
            name="arrow_drop_down"
            size={24}
            className={`pointer-events-none absolute right-3 text-on-surface-variant transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xs bg-surface-container py-2 shadow-elev-2 data-[state=open]:animate-menu-in"
          >
            <SelectPrimitive.Viewport>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className="relative flex h-12 cursor-pointer select-none items-center gap-3 pl-4 pr-12 text-body-large text-on-surface outline-none transition-colors data-[disabled]:text-on-surface/38 data-[highlighted]:bg-on-surface/[0.08] data-[state=checked]:bg-secondary-container/70"
                >
                  {option.icon && (
                    <Icon name={option.icon} size={20} className="text-on-surface-variant" />
                  )}
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-4">
                    <Icon name="check" size={20} className="text-primary" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {label && (
        <label
          className={[
            'pointer-events-none absolute left-3 px-1 transition-all duration-150',
            labelBgClass,
            floated
              ? 'top-0 -translate-y-1/2 text-label-medium'
              : 'top-1/2 -translate-y-1/2 text-body-large',
            open ? 'text-primary' : 'text-on-surface-variant',
          ].join(' ')}
        >
          {label}
        </label>
      )}
    </div>
  )
}
