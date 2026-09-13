import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'primary' | 'secondary' | 'mint' | 'coral' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses: Record<string, string> = {
  primary: 'nintendo-btn-primary',
  secondary: 'nintendo-btn-secondary',
  mint: 'nintendo-btn-mint',
  coral: 'nintendo-btn-coral',
  ghost: 'text-nintendo-muted hover:text-nintendo-text hover:bg-nintendo-bg px-3 py-2 rounded-xl transition-colors',
}

const sizeClasses: Record<string, string> = {
  sm: 'text-xs px-4 py-2 rounded-xl',
  md: 'text-sm px-6 py-3 rounded-2xl',
  lg: 'text-base px-8 py-4 rounded-2xl',
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  const v = variantClasses[variant] || variantClasses.primary
  const s = sizeClasses[size] || sizeClasses.md

  return <Comp className={`${variant !== 'ghost' ? v : ''} ${variant === 'ghost' ? v : s} ${className}`} {...props} />
}
