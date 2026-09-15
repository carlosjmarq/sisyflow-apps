import { useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from './auth/AuthContext'
import { AuthScreen } from './auth/AuthScreen'
import { Home } from './components/Home'
import { TodoList } from './components/TodoList'
import { Epics } from './components/Epics'
import { Settings } from './components/Settings'
import { AppShell } from './components/shell/AppShell'
import { Icon, Spinner } from './components/ui'

function routeDepth(pathname: string): number {
  if (pathname === '/') return 0
  return pathname.split('/').filter(Boolean).length
}

export default function App() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const previousDepth = useRef(routeDepth(location.pathname))

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
            <Icon name="landscape" size={34} filled />
          </div>
          <div className="flex items-center gap-2 text-body-medium text-on-surface-variant">
            <Spinner size={18} />
            Cargando SisyFlow…
          </div>
        </div>
      </div>
    )
  }

  if (!session) return <AuthScreen />

  const depth = routeDepth(location.pathname)
  const goingDeeper = depth >= previousDepth.current
  previousDepth.current = depth

  return (
    <AppShell>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0, x: goingDeeper ? 32 : -32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: goingDeeper ? -32 : 32 }}
          transition={{ duration: 0.25, ease: [0.05, 0.7, 0.1, 1] }}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/project/:projectId" element={<TodoList />} />
            <Route path="/epics" element={<Epics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </AppShell>
  )
}
