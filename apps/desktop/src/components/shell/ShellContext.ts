import { createContext, useContext } from 'react'

export interface ShellContextValue {
  openSearch: () => void
}

export const ShellContext = createContext<ShellContextValue | null>(null)

export function useShell(): ShellContextValue {
  const context = useContext(ShellContext)
  if (!context) throw new Error('useShell debe usarse dentro de AppShell')
  return context
}
