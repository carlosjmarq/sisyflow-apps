import * as React from 'react'
import { Icon } from './Icon'

type ChipVariant = 'assist' | 'filter' | 'input'

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ChipVariant
  selected?: boolean
  leadingIcon?: string
  onRemove?: () => void
  elevated?: boolean
}

export function Chip({
  variant = 'assist',
  selected = false,
  leadingIcon,
  onRemove,
  elevated = false,
  className = '',
  children,
  ...props
}: ChipProps) {
  const showCheck = variant === 'filter' && selected

  return (
    <button
      aria-pressed={variant === 'filter' ? selected : undefined}
      className={[
        'state-layer inline-flex h-8 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-sm px-3',
        'text-label-large transition-colors duration-200',
        selected
          ? 'bg-secondary-container text-on-secondary-container'
          : 'border border-outline-variant bg-surface text-on-surface-variant',
        elevated && !selected ? 'border-transparent shadow-elev-1' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {showCheck && <Icon name="check" size={16} />}
      {!showCheck && leadingIcon && <Icon name={leadingIcon} size={16} />}
      {children}
      {variant === 'input' && onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label="Quitar"
          className="-mr-1 flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-on-surface/10"
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              event.stopPropagation()
              onRemove()
            }
          }}
        >
          <Icon name="close" size={14} />
        </span>
      )}
    </button>
  )
}
