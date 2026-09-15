import { useCallback, useMemo, useState } from 'react'
import { NavigationRail } from './NavigationRail'
import { SearchOverlay } from './SearchOverlay'
import { ShellContext } from './ShellContext'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  const value = useMemo(() => ({ openSearch }), [openSearch])

  return (
    <ShellContext.Provider value={value}>
      <div className="flex h-screen overflow-hidden bg-surface">
        <NavigationRail />
        <div className="relative flex min-w-0 flex-1 flex-col">{children}</div>
        <SearchOverlay open={searchOpen} onClose={closeSearch} />
      </div>
    </ShellContext.Provider>
  )
}
