---
tags: [tecnico, datos, supabase, desktop]
status: permanente
date: 2026-09-13
---

# Capa de datos Supabase

## Contexto

Documenta la capa de datos del desktop tras la Fase 3 (`/cloud`), según
[[ADR-008 Estrategia de datos nube-first]] y [[ADR-009 Migracion Sísifo mapeo y marcador]].
Supabase es la fuente de verdad; Dexie queda solo como origen de la migración.

## Contenido

### Cliente

- `src/lib/supabase.ts`: singleton `createClient<Database>` con
  `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (`.env` local gitignored;
  `.env.example` versionado).
- `detectSessionInUrl: false` (app de escritorio, sin redirects OAuth);
  persistencia de sesión en `localStorage` (por defecto). Cerrar sesión desde el
  header de Home.
- Los tipos `Database` se generan con `supabase gen types` y viven en
  `src/types/supabase.ts` (regenerar tras cada migración).

### Dominio vs filas

- `src/data/mappers.ts` traduce `snake_case` de Postgres ↔ dominio `camelCase`.
- **IDs**: uuid `string` generados en el cliente (`crypto.randomUUID()`) antes
  del insert, de modo que el optimistic update ya tiene el id definitivo.
- **`content`**: en el dominio sigue siendo `string`; los mappers hacen
  `JSON.stringify` al escribir y `JSON.stringify(row.content)` al leer, así el
  editor BlockNote no cambia ([[Editor de contenido (BlockNote)]]).
- **Colores**: épicas y proyectos guardan hex en `color_code`; la paleta
  `PROJECT_COLORS` se usa para elegirlos.

### Hooks (optimistic UI)

| Hook | Consulta | Mutaciones |
| --- | --- | --- |
| `useProjects()` | `projects` con `epics(...)` y `todos(count)` en una sola consulta | crear/editar/borrar con optimista + reversión |
| `useProjectTodos(projectId, sortBy)` | `todos` del proyecto (orden en cliente, como antes) | crear/editar/borrar con optimista + reversión |
| `useEpics()` | todas las épicas | CRUD completo (pantalla `/epics`) |
| `useProjectTags(projectId)` | tags del proyecto | CRUD con UI (ADR-012) |
| `useSearchTodos(query)` | `ilike` sobre título con debounce | búsqueda global con UI (ADR-012) |
| `useDayTodos()` | tareas pendientes de proyectos activos con proyecto/épica embebidos | — (vista "Tareas del día", ADR-010) |
| `useGamification(days)` | RPC `daily_epic_logs_tz` + `epic_streaks` y `streak_global` con la zona horaria del cliente | — (Inicio progress-first, ADR-011/ADR-012) |

Patrón de mutación:

1. Aplicar el cambio al estado local (optimista).
2. Ejecutar la operación en Supabase.
3. Si falla: revertir el estado y mostrar un error vía `ToastProvider`.

Los componentes **nunca** importan el cliente Supabase directamente: solo hooks.
El contenido del editor se guarda con debounce de 800 ms (BlockNote emite en
cada tecla) y se fuerza el guardado al cambiar de tarea o cerrar el drawer.

### Errores y avisos

- `src/components/ui/Toast.tsx`: proveedor mínimo de avisos (sin dependencias).
- Mensajes en español, orientados a la acción del usuario.

### Migración y backup

- `src/migration/sisifo.ts`: lectura de Dexie, mapeo y carga por lotes
  ([[ADR-009 Migracion Sísifo mapeo y marcador]]).
- `src/db/backup.ts`: export v3 (UUIDs) e import v2/v3.
- `src/db/database.ts` (Dexie) se conserva únicamente como origen de la
  migración.

## Pendientes

- [x] Verificación de integración en la Fase 3: 16 comprobaciones (auth,
      consultas de la app, RLS con dos usuarios, trigger de `completed_at`,
      upsert idempotente).
- [x] Verificación E2E de la UI (Fase 3, 2026-09-13, Opera GX): login/logout,
      sesión persistente entre recargas, CRUD de tareas, editor BlockNote con
      flush del contenido, migración Sísifo completa y aislamiento RLS con dos
      usuarios.
- [ ] Robustecer la primera carga tras login: reintentar una vez ante errores
      transitorios de JWT (se observó un `PGRST303: JWT issued at future` una
      única vez tras un reinicio del stack, con relojes sincronizados).
- [ ] Verificación E2E manual de la UI en el build empaquetado (fase `/deliver`).
- [ ] Realtime de Supabase no se usa por ahora (revisar en `/gamification`).
- [ ] Revisar índices cuando el volumen de datos crezca.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[App de escritorio (base TodoDex)]], [[Backend Supabase]], [[Modelo de datos objetivo (Supabase)]]
- **ADR:** [[ADR-005 Supabase como backend]], [[ADR-008 Estrategia de datos nube-first]], [[ADR-009 Migracion Sísifo mapeo y marcador]]
- **Ruta en el monorepo:** `apps/desktop/src/lib/`, `apps/desktop/src/data/`, `apps/desktop/src/hooks/`
