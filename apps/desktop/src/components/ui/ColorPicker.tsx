import { Icon } from './Icon'
import { PROJECT_COLORS } from '../../types'

interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  label?: string
  size?: 'sm' | 'md'
  ringOffsetClass?: string
}

export function ColorPicker({
  value,
  onChange,
  label = 'Color',
  size = 'md',
  ringOffsetClass = 'ring-offset-surface-container-high',
}: ColorPickerProps) {
  const sizeClass = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'

  return (
    <div className="flex flex-col gap-2">
      <span className="text-label-large text-on-surface-variant">{label}</span>
      <div className="flex flex-wrap gap-2">
        {PROJECT_COLORS.map((color) => {
          const selected = value.toLowerCase() === color.bg.toLowerCase()
          return (
            <button
              key={color.value}
              type="button"
              aria-label={color.label}
              aria-pressed={selected}
              onClick={() => onChange(color.bg)}
              className={`state-layer flex shrink-0 items-center justify-center rounded-full transition-transform ${sizeClass} ${
                selected ? `scale-110 ring-2 ring-primary ring-offset-2 ${ringOffsetClass}` : ''
              }`}
              style={{ backgroundColor: color.bg }}
            >
              {selected && <Icon name="check" size={size === 'sm' ? 14 : 18} className="text-white" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
