import * as React from 'react'

type CardVariant = 'elevated' | 'filled' | 'outlined'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  interactive?: boolean
  color?: string
}

const variantClasses: Record<CardVariant, string> = {
  elevated: 'bg-surface-container-low shadow-elev-1',
  filled: 'bg-surface-container-highest',
  outlined: 'border border-outline-variant bg-surface',
}

export function Card({
  className = '',
  variant = 'elevated',
  interactive = false,
  color,
  children,
  style,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded-md',
        variantClasses[variant],
        interactive
          ? 'state-layer state-layer-on-surface cursor-pointer transition-shadow duration-200 hover:shadow-elev-2'
          : '',
        className,
      ].join(' ')}
      style={{ ...style, ...(color ? { backgroundColor: color } : {}) }}
      {...props}
    >
      {children}
    </div>
  )
}
