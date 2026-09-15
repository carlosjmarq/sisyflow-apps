import { useCallback, useRef, useState } from 'react'
import type { PointerEvent } from 'react'

export interface RippleCircle {
  id: number
  x: number
  y: number
  size: number
}

export function useRipple() {
  const [ripples, setRipples] = useState<RippleCircle[]>([])
  const nextId = useRef(0)

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const id = ++nextId.current
    setRipples((prev) => [
      ...prev,
      {
        id,
        x: event.clientX - rect.left - size / 2,
        y: event.clientY - rect.top - size / 2,
        size,
      },
    ])
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id))
    }, 550)
  }, [])

  return { ripples, onPointerDown }
}
