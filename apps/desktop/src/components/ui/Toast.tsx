import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext, type ToastKind } from './ToastContext'
import { Icon } from './Icon'

interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const showToast = useCallback((message: string, kind: ToastKind = 'error') => {
    const id = ++nextId.current
    setToasts((prev) => [...prev, { id, message, kind }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-4 z-[100] flex w-[min(420px,calc(100vw-32px))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex animate-snackbar-in items-center gap-3 rounded-xs bg-inverse-surface px-4 py-3 text-body-medium text-inverse-on-surface shadow-elev-3"
          >
            <Icon
              name={toast.kind === 'error' ? 'error' : 'check_circle'}
              size={20}
              className="shrink-0 text-inverse-primary"
            />
            <span className="min-w-0 break-words">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
