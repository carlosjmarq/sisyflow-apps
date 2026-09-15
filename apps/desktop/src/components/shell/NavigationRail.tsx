import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { Icon } from '../ui/Icon'

interface Destination {
  to: string
  label: string
  icon: string
}

const destinations: Destination[] = [
  { to: '/', label: 'Inicio', icon: 'home' },
  { to: '/epics', label: 'Épicas', icon: 'category' },
  { to: '/settings', label: 'Ajustes', icon: 'settings' },
]

export function NavigationRail() {
  return (
    <nav
      aria-label="Navegación principal"
      className="flex h-full w-20 shrink-0 flex-col items-center gap-3 bg-surface py-4"
    >
      <div className="mb-2 flex h-12 w-12 select-none items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
        <Icon name="landscape" size={26} filled />
      </div>
      {destinations.map((destination) => (
        <NavLink
          key={destination.to}
          to={destination.to}
          end={destination.to === '/'}
          className="group flex w-full flex-col items-center gap-1"
        >
          {({ isActive }) => (
            <>
              <span className="relative flex h-8 w-14 items-center justify-center rounded-full">
                {isActive && (
                  <motion.span
                    layoutId="rail-indicator"
                    className="absolute inset-0 rounded-full bg-secondary-container"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon
                  name={destination.icon}
                  size={24}
                  filled={isActive}
                  className={`relative z-10 transition-colors ${
                    isActive
                      ? 'text-on-secondary-container'
                      : 'text-on-surface-variant group-hover:text-on-surface'
                  }`}
                />
              </span>
              <span
                className={`text-label-medium transition-colors ${
                  isActive ? 'text-on-surface' : 'text-on-surface-variant'
                }`}
              >
                {destination.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
