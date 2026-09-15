import * as React from 'react'
import { Icon } from './Icon'
import { Tooltip } from './Tooltip'

export type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined'
export type IconButtonSize = 'sm' | 'md' | 'lg'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string
  label: string
  variant?: IconButtonVariant
  size?: IconButtonSize
  filled?: boolean
  selected?: boolean
  disableTooltip?: boolean
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const variantClasses: Record<IconButtonVariant, string> = {
  standard:
    'text-on-surface-variant enabled:hover:text-on-surface disabled:text-on-surface/38',
  filled:
    'bg-primary text-on-primary enabled:hover:shadow-elev-1 disabled:bg-on-surface/12 disabled:text-on-surface/38',
  tonal:
    'bg-secondary-container text-on-secondary-container enabled:hover:shadow-elev-1 disabled:bg-on-surface/12 disabled:text-on-surface/38',
  outlined:
    'border border-outline text-on-surface-variant enabled:hover:text-on-surface disabled:text-on-surface/38 disabled:border-on-surface/12',
}

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

const iconSizes: Record<IconButtonSize, number> = { sm: 18, md: 22, lg: 26 }

export function IconButton({
  icon,
  label,
  variant = 'standard',
  size = 'md',
  filled = false,
  selected = false,
  disableTooltip = false,
  side = 'top',
  className = '',
  disabled,
  ...props
}: IconButtonProps) {
  const button = (
    <button
      aria-label={label}
      aria-pressed={selected || undefined}
      className={[
        'state-layer inline-flex shrink-0 select-none items-center justify-center rounded-full',
        'transition-colors duration-200 disabled:cursor-not-allowed',
        selected && variant === 'standard' ? 'text-primary' : '',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      disabled={disabled}
      {...props}
    >
      <Icon name={icon} size={iconSizes[size]} filled={filled || selected} />
    </button>
  )

  if (disableTooltip) return button

  return (
    <Tooltip content={label} side={side}>
      {button}
    </Tooltip>
  )
}
