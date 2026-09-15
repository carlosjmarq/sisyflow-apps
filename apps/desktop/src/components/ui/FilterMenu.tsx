import { Icon } from './Icon'
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger } from './Menu'

interface FilterMenuOption {
  value: string
  label: string
}

interface FilterMenuProps {
  label?: string
  value: string
  options: FilterMenuOption[]
  onChange: (value: string) => void
  leadingDot?: string
  align?: 'start' | 'center' | 'end'
}

export function FilterMenu({
  label,
  value,
  options,
  onChange,
  leadingDot,
  align = 'start',
}: FilterMenuProps) {
  const current = options.find((option) => option.value === value)?.label ?? value

  return (
    <Menu>
      <MenuTrigger asChild>
        <button className="state-layer flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-label-large text-on-surface-variant transition-colors hover:text-on-surface">
          {leadingDot && (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: leadingDot }}
            />
          )}
          {label ? `${label}: ${current}` : current}
          <Icon name="arrow_drop_down" size={20} />
        </button>
      </MenuTrigger>
      <MenuContent align={align}>
        <MenuRadioGroup value={value} onValueChange={(next: string) => onChange(next)}>
          {options.map((option) => (
            <MenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  )
}
