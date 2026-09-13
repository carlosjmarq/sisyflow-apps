import * as React from 'react'
import { useRef, useState } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  className?: string
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
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
        className={`absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-[70] max-w-[320px] px-2.5 py-1.5 rounded-lg bg-nintendo-text text-white text-xs font-medium shadow-soft-md pointer-events-none break-words transition-opacity duration-150 ${
          show ? 'opacity-100 delay-300' : 'opacity-0 invisible delay-0'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
