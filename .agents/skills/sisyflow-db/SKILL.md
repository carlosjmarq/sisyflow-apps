---
name: sisyflow-db
description: Guía para trabajar con la capa de datos de SisyFlow (Supabase nube-first con UI optimista; Dexie/IndexedDB solo como origen de la migración Sísifo). Úsala cuando se hable de base de datos, Supabase, mappers, hooks de datos, RLS, esquema, migraciones, migración Sísifo, backup, o de agregar/quitar/modificar campos, tablas, consultas u operaciones de persistencia. Actívala ante cualquier tarea de guardar, consultar o estructurar datos.
---

# SisyFlow Database Skill

Eres el experto en la capa de datos de SisyFlow (`apps/desktop/src/`).

Estado desde la Fase 3 (`/cloud`):

1. **Supabase es la fuente de verdad** ([[ADR-008 Estrategia de datos nube-first]]).
   Los hooks operan contra Supabase con **UI optimista**: aplican el cambio en
   estado, escriben, y revierten mostrando un aviso si falla la red.
2. **Dexie/IndexedDB es solo el origen de la migración Sísifo** (US 1.2,
   [[ADR-009 Migracion Sísifo mapeo y marcador]]). La app no escribe ahí.

Para trabajo de SQL/RLS/CLI carga además la skill `supabase`.

## Arquitectura de la capa

```
componentes ──> hooks (src/hooks/useProjects.ts, useSearchTodos.ts)
                  │  optimistic + reversión + toast
                  ▼
              mappers (src/data/mappers.ts)      fila snake_case ↔ dominio camelCase
                  │
                  ▼
              cliente (src/lib/supabase.ts)      createClient<Database> con env
                  │
                  ▼
              Supabase (nube) — RLS auth.uid() = user_id
```

Reglas duras:

- Los componentes **nunca** importan el cliente Supabase: siempre hooks.
- Los IDs de dominio son **uuid string**; en el alta se generan con
  `crypto.randomUUID()` para que el optimistic update use el id definitivo.
- `content` es `string` en el dominio y `jsonb` en la base: los mappers hacen
  `JSON.stringify` al leer y `parseContent` al escribir.
- Los colores se guardan en `color_code` como **hex** (paleta `PROJECT_COLORS`).
- El contenido del editor se guarda con **debounce de 800 ms** en `TodoDrawer`
  (BlockNote emite en cada tecla); se fuerza el guardado al cambiar de tarea,
  cerrar el drawer o desmontar.
- `useDayTodos()` alimenta la vista "Tareas del día": pendientes de proyectos
  activos (los pausados/completados quedan fuera, ADR-010).

## Esquema Supabase (Fase 2)

- `epics(id, user_id, name, color_code, created_at)` — sin estado de completado.
- `projects(id, epic_id, user_id, name, color_code, status, created_at)` —
  `epic_id` obligatorio; `status`: `active | paused | completed`. La FK de
  `epic_id` es `on delete restrict`: no se puede borrar una épica con proyectos
  ([[ADR-010 Ciclo de vida de proyectos y vista del dia]]).
- `todos(id, project_id, user_id, title, status, priority, urgency,
  expiration_date, content jsonb, content_format, completed_at, created_at,
  updated_at)` — `completed_at` lo asigna un trigger al pasar a `done` y lo
  limpia al salir; `status`: `backlog | todo | in-progress | done | cancelled`.
- `tags(id, project_id, user_id, name, color_code)`.
- Vista `daily_epic_logs(day, epic_id, completed_count)` con `security_invoker`.
- RPCs de gamificación: `daily_epic_logs_tz(p_tz, p_days)` y
  `epic_streaks(p_tz, p_today)` (security invoker; execute solo `authenticated`).
- RLS `auth.uid() = user_id` en todas las tablas; el rol `anon` no accede.

Tipos generados: `src/types/supabase.ts`. Tras cada migración:
`cmd /c "supabase gen types typescript --local > ..\apps\desktop\src\types\supabase.ts"`
(desde `backend/`; en Windows el redirect de PowerShell 5.1 escribe UTF-16).

## Patrón de un hook de datos

```ts
export function useRecurso(projectId?: string) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [items, setItems] = useState<Recurso[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!projectId || !user) { setItems([]); setLoading(false); return }
    const { data, error } = await supabase.from('recurso').select('*').eq('project_id', projectId)
    if (error) { console.error(error); showToast('No se pudieron cargar…'); setLoading(false); return }
    setItems((data ?? []).map(mapRecurso))
    setLoading(false)
  }, [projectId, user, showToast])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (input: NuevoInput) => {
    if (!projectId || !user) return null
    const item: Recurso = { id: crypto.randomUUID(), projectId, ...input }
    setItems((prev) => [item, ...prev])                       // optimista
    const { error } = await supabase.from('recurso').insert(recursoInsertFromDomain(item, user.id))
    if (error) { console.error(error); setItems((prev) => prev.filter((r) => r.id !== item.id)); showToast('No se pudo crear…'); return null }
    return item.id
  }, [projectId, user, showToast])

  const update = useCallback(async (id: string, updates: Partial<Recurso>) => {
    const previous = items
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)))
    const { error } = await supabase.from('recurso').update(recursoUpdateFromDomain(updates)).eq('id', id)
    if (error) { console.error(error); setItems(previous); showToast('No se pudo guardar el cambio') }
  }, [items, showToast])

  // delete: igual — quitar del estado, borrar, restaurar `previous` si falla
  return { items, loading, create, update, remove, reload: load }
}
```

Notas:

- Consulta de Home: una sola llamada a `projects` con `epics(...)` y
  `todos(status)` para evitar N+1 (los conteos se calculan en `mapProject`).
- No borrar hijos a mano: los FKs son `on delete cascade`.
- Un update de `status` recalcula `completedAt` en el dominio; el trigger de la
  base es la fuente final.

## Migración Sísifo y backup

- `src/migration/sisifo.ts`: lee Dexie (`db.projects/todos/epics/tags`), mapea y
  hace upsert por lotes (100). Épicas deduplicadas por nombre; proyecto sin
  épica → "General"; `completed_at` = `updatedAt` si `done`; markdown → bloques.
- IDs **deterministas** (`stableUuid`) + `upsert({ onConflict: 'id',
  ignoreDuplicates: true })` → reintentar nunca duplica.
- Marcador `sisyflow.sisifo.migratedAt` en `localStorage`; la pantalla Settings
  lo usa para bloquear la re-ejecución.
- `src/db/backup.ts`: export v3 (filas UUID), import v2 (mismo mapeo Sísifo) y v3.

## Flujo de trabajo recomendado

1. **Lee** `src/types/index.ts`, `src/data/mappers.ts` y el hook involucrado.
2. **Explica** el cambio y su impacto en paridad ([[Paridad funcional con TodoDex]]).
3. **Edita** en orden: tipos → mappers → hook → componente.
4. **Verifica**: `pnpm lint` y `npx tsc --noEmit` verdes; si tocó SQL,
   `supabase db reset` + `supabase test db` + tipos regenerados.
