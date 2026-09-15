import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion/react'
import { Card, Icon, Skeleton } from './ui'

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)

  useEffect(() => {
    const controls = animate(previous.current, value, {
      duration: 0.6,
      ease: [0.05, 0.7, 0.1, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })
    previous.current = value
    return () => controls.stop()
  }, [value])

  return <>{display}</>
}

interface StreakHeroProps {
  scopeLabel: string
  scopeColor?: string | null
  current: number
  best: number
  loading?: boolean
}

export function StreakHero({ scopeLabel, scopeColor, current, best, loading }: StreakHeroProps) {
  if (loading) {
    return (
      <Card variant="elevated" className="flex items-center justify-between gap-6 p-6">
        <div className="flex items-center gap-5">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-24" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </Card>
    )
  }

  return (
    <Card variant="elevated" className="flex items-center justify-between gap-6 p-6">
      <div className="flex min-w-0 items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
          <Icon name="local_fire_department" size={36} filled />
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-label-large text-on-surface-variant">
            {scopeColor && (
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: scopeColor }} />
            )}
            <span className="truncate">Racha actual · {scopeLabel}</span>
          </p>
          <p className="flex items-baseline gap-2">
            <span className="text-display-medium tabular-nums text-on-surface">
              <AnimatedNumber value={current} />
            </span>
            <span className="text-title-medium text-on-surface-variant">
              {current === 1 ? 'día' : 'días'}
            </span>
          </p>
          <p className="text-body-small text-on-surface-variant">
            {current === 0
              ? 'Completá una tarea hoy para encenderla'
              : current === 1
                ? 'La roca ya se movió hoy'
                : 'Seguí así: un día a la vez'}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Icon name="emoji_events" size={20} />
          <span className="text-label-large">Mejor marca</span>
        </div>
        <span className="text-headline-medium tabular-nums text-on-surface">
          <AnimatedNumber value={best} />
        </span>
        <span className="text-body-small text-on-surface-variant">
          {best === 1 ? 'día' : 'días'}
        </span>
      </div>
    </Card>
  )
}
