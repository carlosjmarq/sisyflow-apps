---
tags: [tecnico, datos, supabase, esquema]
status: borrador
date: 2026-09-13
---

# Modelo de datos objetivo (Supabase)

## Contexto

Esquema relacional destino para SisyFlow: cubre las user stories del backlog
([[US's for personal development project]]) **y** los campos actuales de TodoDex
exigidos por el guardrail de paridad ([[Paridad funcional con TodoDex]]). El SQL
definitivo se escribe en la fase `/backend`; esta nota es el contrato de diseño.

## Contenido

### Tablas

#### `epics` — áreas de vida continuas (US 2.1)

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `user_id` | `uuid` | FK → `auth.users`, RLS |
| `name` | `text` | obligatorio |
| `color_code` | `text` | hex, ej. `#22C55E` |
| `created_at` | `timestamptz` | `default now()` |

Sin estado de completado: las Épicas son continuas.

#### `projects` — proyectos finitos (US 2.2)

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `epic_id` | `uuid` | FK → `epics`, **obligatorio** |
| `user_id` | `uuid` | FK → `auth.users`, RLS |
| `name` | `text` | obligatorio |
| `color_code` | `text` | paridad: color de tarjeta actual |
| `status` | `project_status` enum | `active`, `paused`, `completed`; default `active` |
| `created_at` | `timestamptz` | `default now()` |

Pausar/completar oculta tareas incompletas del día a día sin borrar historial.

#### `todos` — empujes diarios (US 2.3 + paridad)

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `project_id` | `uuid` | FK → `projects`, obligatorio |
| `user_id` | `uuid` | FK → `auth.users`, RLS |
| `title` | `text` | obligatorio |
| `status` | `todo_status` enum | `backlog`, `todo`, `in-progress`, `done`, `cancelled`; default `todo` (paridad) |
| `priority` | `priority` enum | `low`, `medium`, `high`, `critical` (paridad) |
| `urgency` | `urgency` enum | igual escala (paridad) |
| `expiration_date` | `timestamptz` | nullable (paridad) |
| `content` | `jsonb` | bloques BlockNote; default `'[]'` (paridad) |
| `content_format` | `text` | `'blocknote'` (paridad; legacy `'markdown'`) |
| `completed_at` | `timestamptz` | nullable; **automático** al pasar a `done` (US 2.3), se limpia al salir |
| `created_at` | `timestamptz` | `default now()` |
| `updated_at` | `timestamptz` | paridad (Dexie v4) |

`is_completed` no se almacena: equivale a `status = 'done'`.

#### `tags` — por proyecto (paridad)

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `project_id` | `uuid` | FK → `projects` |
| `user_id` | `uuid` | FK → `auth.users`, RLS |
| `name` | `text` | |
| `color_code` | `text` | nullable (paridad: `Tag.color` opcional) |

### Vista `daily_epic_logs` (US 3.1)

- Devuelve `[day, epic_id, completed_count]` agrupando tareas con `completed_at`
  no nulo, uniendo `todos` → `projects`.
- `security_invoker = true` para que respete RLS.
- Índices de apoyo: `todos(completed_at)`, `todos(project_id)`, `projects(epic_id)`.

### RLS

Todas las tablas: `user_id = auth.uid()` en `select`, `insert`, `update`, `delete`
([[ADR-005 Supabase como backend]]). Se prueba con dos usuarios.

### Mapeo desde Dexie (migración Sísifo, US 1.2)

| Origen (Dexie v4) | Destino | Nota |
| --- | --- | --- |
| `projects.id` (número) | `projects.id` (uuid) | tabla de correlación en memoria |
| `projects.color` | `projects.color_code` | |
| `projects` sin épica | `projects.epic_id` | asignación al migrar ([[ADR-007 Jerarquia Epicas Proyectos Tareas]]) |
| `epics` (por proyecto) | `epics` (top-level) | deduplicar por nombre |
| `todos.*` | `todos.*` | 1:1 salvo `completed_at` (derivado de `status = 'done'`) |
| `todos.content` string markdown | `todos.content` jsonb | convertir a bloques en la migración |
| `tags` | `tags` | 1:1 |

## Pendientes

- [ ] Escribir el SQL definitivo (migraciones) en `/backend`.
- [ ] Resolver la asignación de proyecto→épica para proyectos con varias épicas (ADR-007).
- [ ] Definir índices exactos según consultas del heatmap y las vistas del día.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Backend Supabase]], [[Gamificacion]], [[Paridad funcional con TodoDex]]
- **ADR:** [[ADR-005 Supabase como backend]], [[ADR-007 Jerarquia Epicas Proyectos Tareas]], [[ADR-008 Estrategia de datos nube-first]]
- **Ruta en el monorepo:** `backend/supabase/migrations/`
