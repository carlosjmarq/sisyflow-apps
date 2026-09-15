interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />
}

interface SpinnerProps {
  size?: number
  className?: string
}

export function Spinner({ size = 24, className = '' }: SpinnerProps) {
  return (
    <span
      role="progressbar"
      aria-label="Cargando"
      className={`inline-block shrink-0 text-primary ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" className="h-full w-full animate-[spin_1.4s_linear_infinite]">
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="4"
        />
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="125"
          strokeDashoffset="95"
        />
      </svg>
    </span>
  )
}
