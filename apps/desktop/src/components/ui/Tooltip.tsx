import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { useRef, useState } from 'react'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function Tooltip({ content, children, side = 'top', className = '' }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={`z-[80] max-w-[320px] break-words rounded-xs bg-inverse-surface px-2.5 py-1.5 text-label-medium text-inverse-on-surface shadow-elev-1 data-[state=delayed-open]:animate-fade-in ${className}`}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

interface TruncatedTooltipProps {
  content: string
  children: React.ReactNode
  className?: string
}

export function TruncatedTooltip({ content, children, className = '' }: TruncatedTooltipProps) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  const handleMouseEnter = () => {
    const wrapper = innerRef.current
    if (!wrapper) return
    const target = (wrapper.firstElementChild as HTMLElement | null) ?? wrapper
    setShow(target.scrollWidth > target.clientWidth)
  }

  return (
    <div
      className={`relative min-w-0 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      <div ref={innerRef} className="min-w-0">
        {children}
      </div>
      <div
        className={`pointer-events-none absolute left-1/2 top-full z-[70] mt-1.5 max-w-[320px] -translate-x-1/2 break-words rounded-xs bg-inverse-surface px-2.5 py-1.5 text-label-medium text-inverse-on-surface shadow-elev-1 transition-opacity duration-150 ${
          show ? 'opacity-100 delay-300' : 'invisible opacity-0 delay-0'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
