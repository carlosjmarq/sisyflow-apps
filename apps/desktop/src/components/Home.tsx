import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Fab,
  FilterMenu,
  Icon,
  Menu,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
  Skeleton,
} from './ui'
import { TopAppBar } from './shell/TopAppBar'
import { StreakHero } from './StreakHero'
import { Heatmap } from './Heatmap'
import { EpicStreakChips } from './EpicStreakChips'
import { DayView } from './DayView'
import { ProjectCard } from './ProjectCard'
import { ProjectForm } from './ProjectForm'
import { useEpics, useProjects } from '../hooks/useProjects'
import { useGamification } from '../hooks/useGamification'
import { PROJECT_SORT_OPTIONS, type Project, type ProjectSortKey } from '../types'

function todayLabel(): string {
  const formatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function HeatmapSkeleton() {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: 18 }).map((_, column) => (
        <div key={column} className="flex flex-col gap-[3px]">
          {Array.from({ length: 7 }).map((_, row) => (
            <Skeleton key={row} className="h-3.5 w-3.5 rounded-[4px]" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function Home() {
  const [scope, setScope] = useState('global')
  const [expanded, setExpanded] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [sortBy, setSortBy] = useState<ProjectSortKey>('createdAt')

  const {
    projects,
    loading: projectsLoading,
    createProject,
    deleteProject,
    updateProject,
  } = useProjects()
  const { epics } = useEpics()
  const { logs, streaks, globalStreak, loading: statsLoading } = useGamification()

  const epicsById = useMemo(() => new Map(epics.map((epic) => [epic.id, epic])), [epics])
  const selectedEpic = scope === 'global' ? null : epicsById.get(scope) ?? null

  useEffect(() => {
    if (scope !== 'global' && !epicsById.has(scope)) setScope('global')
  }, [scope, epicsById])

  const scopedStreak = selectedEpic
    ? streaks.find((streak) => streak.epicId === selectedEpic.id) ?? { current: 0, best: 0 }
    : globalStreak
  const filteredLogs = useMemo(
    () => (selectedEpic ? logs.filter((log) => log.epicId === selectedEpic.id) : logs),
    [logs, selectedEpic],
  )

  const scopeOptions = useMemo(
    () => [
      { value: 'global', label: 'Vista global' },
      ...epics.map((epic) => ({ value: epic.id, label: epic.name })),
    ],
    [epics],
  )

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [projects, sortBy])

  const projectGroups = useMemo(() => {
    const groups = new Map<string, { epic?: Project['epic']; projects: Project[] }>()
    for (const project of sortedProjects) {
      const group = groups.get(project.epicId) ?? { epic: project.epic, projects: [] }
      group.projects.push(project)
      groups.set(project.epicId, group)
    }
    return [...groups.values()].sort((a, b) => (a.epic?.name ?? '').localeCompare(b.epic?.name ?? ''))
  }, [sortedProjects])

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <TopAppBar title="Inicio" subtitle={todayLabel()} />

      <div className="flex-1 overflow-y-auto px-6 pb-28">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 pt-2">
          <StreakHero
            scopeLabel={selectedEpic?.name ?? 'Global'}
            scopeColor={selectedEpic?.colorCode}
            current={scopedStreak.current}
            best={scopedStreak.best}
            loading={statsLoading}
          />

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-title-medium text-on-surface">Mapa de calor</h2>
              <div className="flex items-center gap-1">
                <FilterMenu
                  value={scope}
                  options={scopeOptions}
                  onChange={setScope}
                  leadingDot={selectedEpic?.colorCode}
                  align="end"
                />
                <Button
                  variant="text"
                  icon={expanded ? 'expand_less' : 'expand_more'}
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded ? 'Ver menos' : 'Ver año completo'}
                </Button>
              </div>
            </div>
            <Card variant="outlined" className="overflow-x-auto p-4">
              {statsLoading ? (
                <HeatmapSkeleton />
              ) : (
                <Heatmap
                  logs={filteredLogs}
                  baseColor={selectedEpic?.colorCode}
                  days={expanded ? 365 : 126}
                />
              )}
            </Card>
            <EpicStreakChips
              streaks={streaks}
              epics={epics}
              selectedScope={scope}
              onSelect={setScope}
              loading={statsLoading}
            />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-title-medium text-on-surface">Tareas del día</h2>
            <DayView />
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-title-medium text-on-surface">Proyectos</h2>
              <Menu>
                <MenuTrigger asChild>
                  <button className="state-layer flex h-10 items-center gap-2 rounded-full px-4 text-label-large text-on-surface-variant transition-colors hover:text-on-surface">
                    <Icon name="sort" size={18} />
                    {PROJECT_SORT_OPTIONS.find((option) => option.value === sortBy)?.label}
                  </button>
                </MenuTrigger>
                <MenuContent align="end">
                  <MenuRadioGroup
                    value={sortBy}
                    onValueChange={(value: string) => setSortBy(value as ProjectSortKey)}
                  >
                    {PROJECT_SORT_OPTIONS.map((option) => (
                      <MenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuRadioItem>
                    ))}
                  </MenuRadioGroup>
                </MenuContent>
              </Menu>
            </div>

            {projectsLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-[180px] w-full rounded-md" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <Card variant="outlined" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <Icon name="folder_open" size={40} className="text-on-surface-variant/60" />
                <p className="text-body-medium text-on-surface">No hay proyectos aún</p>
                <Button variant="tonal" icon="add" onClick={() => setFormOpen(true)}>
                  Crear primer proyecto
                </Button>
              </Card>
            ) : (
              projectGroups.map((group) => (
                <div key={group.epic?.id ?? 'sin-epica'} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: group.epic?.colorCode ?? 'rgb(var(--md-primary))' }}
                    />
                    <span className="text-title-small text-on-surface">
                      {group.epic?.name ?? 'Sin épica'}
                    </span>
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-small text-on-surface-variant">
                      {group.projects.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.projects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onDelete={deleteProject}
                        onUpdate={updateProject}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>

      <div className="absolute bottom-6 right-6">
        <Fab icon="add" label="Nuevo proyecto" onClick={() => setFormOpen(true)} />
      </div>

      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreate={(name, color, epicId) => {
          void createProject(name, color, epicId)
        }}
      />
    </div>
  )
}
