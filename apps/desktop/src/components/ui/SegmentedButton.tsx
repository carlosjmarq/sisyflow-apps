import { motion } from 'motion/react'
import { Icon } from './Icon'

export interface SegmentedOption {
  value: string
  label: string
  icon?: string
}

interface SegmentedButtonProps {
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SegmentedButton({ options, value, onChange, className = '' }: SegmentedButtonProps) {
  return (
    <div
      role="group"
      className={`inline-flex h-10 items-stretch overflow-hidden rounded-full border border-outline ${className}`}
    >
      {options.map((option, index) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={[
              'state-layer relative flex items-center justify-center gap-2 px-4 text-label-large transition-colors duration-200',
              selected ? 'text-on-secondary-container' : 'text-on-surface',
              index > 0 ? 'border-l border-outline' : '',
            ].join(' ')}
          >
            {selected && (
              <motion.span
                layoutId="segmented-pill"
                className="absolute inset-0 bg-secondary-container"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {selected ? (
                <Icon name="check" size={16} />
              ) : option.icon ? (
                <Icon name={option.icon} size={16} />
              ) : null}
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
