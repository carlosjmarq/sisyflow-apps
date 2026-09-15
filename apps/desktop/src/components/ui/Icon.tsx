import type { CSSProperties } from 'react'

type IconWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700

interface IconProps {
  name: string
  filled?: boolean
  size?: number
  weight?: IconWeight
  className?: string
  style?: CSSProperties
}

export function Icon({
  name,
  filled = false,
  size = 24,
  weight = 400,
  className = '',
  style,
}: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-rounded inline-block shrink-0 select-none leading-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
        ...style,
      }}
    >
      {name}
    </span>
  )
}
