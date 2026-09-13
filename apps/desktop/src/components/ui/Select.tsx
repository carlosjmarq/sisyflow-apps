import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  icon?: React.ReactNode
}

export function Select({ label, options, value, onChange, placeholder = 'Seleccionar...', icon }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-semibold text-nintendo-muted">{label}</span>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onChange}>
        <SelectPrimitive.Trigger className="group flex items-center justify-between gap-2 min-w-[130px] pl-3 pr-2.5 py-1.5 rounded-full bg-white border border-nintendo-border/60 text-xs font-medium text-nintendo-text shadow-soft hover:border-lavender-dark/70 hover:shadow-soft-md focus:outline-none focus:border-lavender data-[state=open]:border-lavender data-[state=open]:shadow-soft-md transition-all duration-200">
          <span className="flex items-center gap-1.5 min-w-0">
            {icon && <span className="flex-shrink-0 text-nintendo-muted">{icon}</span>}
            <SelectPrimitive.Value placeholder={placeholder} />
          </span>
          <SelectPrimitive.Icon>
            <ChevronDown className="w-3.5 h-3.5 text-nintendo-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="z-50 bg-nintendo-card rounded-2xl shadow-soft-lg border border-nintendo-border/60 overflow-hidden"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="max-h-64">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className="px-4 py-2 text-xs text-nintendo-text hover:bg-mint/30 cursor-pointer outline-none data-[highlighted]:bg-lavender/30 data-[state=checked]:font-semibold transition-colors"
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  )
}
