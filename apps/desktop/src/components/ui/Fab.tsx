import * as React from 'react'
import { Icon } from './Icon'
import { RippleLayer } from './Ripple'
import { useRipple } from './useRipple'

type FabVariant = 'primary' | 'secondary' | 'tertiary'

interface FabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string
  label?: string
  variant?: FabVariant
  size?: 'md' | 'lg'
}

const variantClasses: Record<FabVariant, string> = {
  primary: 'bg-primary-container text-on-primary-container',
  secondary: 'bg-secondary-container text-on-secondary-container',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
}

export function Fab({
  icon,
  label,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: FabProps) {
  const { ripples, onPointerDown } = useRipple()

  return (
    <button
      aria-label={label ?? undefined}
      onPointerDown={onPointerDown}
      className={[
        'state-layer relative inline-flex select-none items-center justify-center gap-3 rounded-lg',
        'font-medium shadow-elev-3 transition-shadow duration-200 hover:shadow-elev-4',
        variantClasses[variant],
        label ? 'h-14 px-4' : size === 'lg' ? 'h-24 w-24' : 'h-14 w-14',
        label ? 'text-label-large' : '',
        className,
      ].join(' ')}
      {...props}
    >
      <Icon name={icon} size={label ? 24 : size === 'lg' ? 36 : 24} />
      {label && <span className="pr-1">{label}</span>}
      <RippleLayer ripples={ripples} />
    </button>
  )
}
