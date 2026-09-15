import type { RippleCircle } from './useRipple'

export function RippleLayer({ ripples }: { ripples: RippleCircle[] }) {
  return (
    <>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute animate-ripple rounded-full bg-current"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </>
  )
}
