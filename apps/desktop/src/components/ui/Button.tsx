import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Icon } from './Icon'
import { RippleLayer } from './Ripple'
import { useRipple } from './useRipple'

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: string
  trailingIcon?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  filled: 'bg-primary text-on-primary enabled:hover:shadow-elev-1',
  tonal: 'bg-secondary-container text-on-secondary-container enabled:hover:shadow-elev-1',
  outlined:
    'border border-outline text-primary enabled:hover:bg-primary/[0.08] disabled:border-on-surface/12',
  text: 'text-primary enabled:hover:bg-primary/[0.08]',
  elevated:
    'bg-surface-container-low text-primary shadow-elev-1 enabled:hover:shadow-elev-2',
  danger: 'bg-error text-on-error enabled:hover:shadow-elev-1',
}

const disabledClasses: Record<ButtonVariant, string> = {
  filled: 'disabled:bg-on-surface/12 disabled:text-on-surface/38 disabled:shadow-none',
  tonal: 'disabled:bg-on-surface/12 disabled:text-on-surface/38 disabled:shadow-none',
  outlined: 'disabled:text-on-surface/38',
  text: 'disabled:text-on-surface/38',
  elevated: 'disabled:bg-on-surface/12 disabled:text-on-surface/38 disabled:shadow-none',
  danger: 'disabled:bg-on-surface/12 disabled:text-on-surface/38 disabled:shadow-none',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-4 text-label-medium',
  md: 'h-10 px-6 text-label-large',
  lg: 'h-12 px-8 text-title-small',
}

const iconSizes: Record<ButtonSize, number> = { sm: 18, md: 18, lg: 20 }

export function Button({
  className = '',
  variant = 'filled',
  size = 'md',
  asChild = false,
  icon,
  trailingIcon,
  children,
  disabled,
  onPointerDown,
  ...props
}: ButtonProps) {
  const { ripples, onPointerDown: handleRipple } = useRipple()

  const classes = [
    'state-layer relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full',
    'font-medium tracking-[0.1px] transition-shadow duration-200',
    'disabled:cursor-not-allowed disabled:shadow-none',
    variantClasses[variant],
    disabledClasses[variant],
    sizeClasses[size],
    className,
  ].join(' ')

  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    )
  }

  return (
    <button
      className={classes}
      disabled={disabled}
      onPointerDown={(event) => {
        if (!disabled) handleRipple(event)
        onPointerDown?.(event)
      }}
      {...props}
    >
      {icon && <Icon name={icon} size={iconSizes[size]} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={iconSizes[size]} />}
      <RippleLayer ripples={ripples} />
    </button>
  )
}
