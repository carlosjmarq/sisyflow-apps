import * as React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  color?: string
}

export function Card({ className = '', hoverable = true, color, children, ...props }: CardProps) {
  return (
    <div
      className={`${hoverable ? 'nintendo-card cursor-pointer' : 'bg-nintendo-card rounded-3xl shadow-soft border border-nintendo-border/60'} ${className}`}
      style={color ? { backgroundColor: color } : undefined}
      {...props}
    >
      {children}
    </div>
  )
}
