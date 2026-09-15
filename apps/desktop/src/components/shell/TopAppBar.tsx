import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconButton } from '../ui/IconButton'
import { Icon } from '../ui/Icon'
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '../ui/Menu'
import { useAuth } from '../../auth/AuthContext'
import { useTheme } from '../../theme/ThemeContext'
import { useShell } from './ShellContext'

interface TopAppBarProps {
  title?: string
  subtitle?: string
  onBack?: () => void
  actions?: ReactNode
}

function GlobalActions() {
  const { openSearch } = useShell()
  const { resolved, toggle } = useTheme()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-1">
      <IconButton icon="search" label="Buscar tareas" onClick={openSearch} />
      <IconButton
        icon={resolved === 'dark' ? 'light_mode' : 'dark_mode'}
        label={resolved === 'dark' ? 'Tema claro' : 'Tema oscuro'}
        onClick={toggle}
      />
      <Menu>
        <MenuTrigger asChild>
          <button
            aria-label="Cuenta"
            className="state-layer flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <Icon name="account_circle" size={24} />
          </button>
        </MenuTrigger>
        <MenuContent align="end">
          <MenuLabel className="selectable truncate">{user?.email}</MenuLabel>
          <MenuSeparator />
          <MenuItem onSelect={() => navigate('/settings')}>
            <Icon name="settings" size={20} className="text-on-surface-variant" />
            Configuración
          </MenuItem>
          <MenuItem
            className="text-error"
            onSelect={() => {
              void signOut()
            }}
          >
            <Icon name="logout" size={20} />
            Cerrar sesión
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  )
}

export function TopAppBar({ title, subtitle, onBack, actions }: TopAppBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 bg-surface px-4">
      {onBack && <IconButton icon="arrow_back" label="Volver" onClick={onBack} />}
      {title && (
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-title-large text-on-surface">{title}</h1>
          {subtitle && (
            <p className="truncate text-body-small text-on-surface-variant">{subtitle}</p>
          )}
        </div>
      )}
      {!title && <div className="flex-1" />}
      <div className="flex items-center gap-1">
        {actions}
        <GlobalActions />
      </div>
    </header>
  )
}
