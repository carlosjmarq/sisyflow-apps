# backend — Supabase

Backend de SisyFlow: Supabase (Postgres + Auth + RLS). Parte del monorepo `sisyflow-apps` ([[ADR-002 Monorepo unico]]).

> Estado (Fase 2, 2026-09-13): proyecto Supabase inicializado en `backend/supabase/`
> (migración inicial, seed, RLS con tests pgTAP y tipos generados para el desktop).

## Stack

- Supabase CLI + Docker (desarrollo local)
- Postgres (imagen gestionada por el CLI)
- Auth email/contraseña (US 1.1)
- RLS obligatoria en todas las tablas
- Edge Functions solo si un ADR lo justifica
- Tipos TypeScript generados para `apps/desktop`

## Estructura

```
backend/
└── supabase/
    ├── config.toml      # project_id sisyflow; puertos 453xx (restricción de Windows)
    ├── migrations/      # 20260913191443_initial_schema.sql, 20260913205909_epic_delete_restrict.sql,
    │                    # 20260913211858_gamification_rpc.sql, 20260913224500_global_streak.sql,
    │                    # 20260920120000_recurring_todos.sql
    ├── tests/           # rls_test.sql, hierarchy_test.sql, gamification_test.sql,
    │                    # global_streak_test.sql, recurring_test.sql (pgTAP, 61 aserciones)
    ├── functions/       # edge functions (vacío; solo con ADR)
    └── seed.sql         # usuarios de prueba + datos de ejemplo
```

## Comandos (dev)

```
supabase start                        # stack local (puertos 453xx)
supabase status                       # URLs y claves locales
supabase migration new <nombre>       # crea migración
supabase db reset                     # recrea DB local + seed
supabase test db                      # tests pgTAP (RLS, jerarquía, gamificación)
supabase db advisors --local          # issues de seguridad/performance
supabase db push                      # aplica migraciones al remoto
```

Para regenerar tipos (en Windows, el redirect de PowerShell 5.1 escribe UTF-16;
usar `cmd /c`):

```
cmd /c "supabase gen types typescript --local > ..\apps\desktop\src\types\supabase.ts"
cmd /c "supabase gen types typescript --local > ..\apps\cli\src\types\supabase.ts"
```

Ambos destinos consumen el mismo esquema: el desktop (reactivo) y el CLI
([[ADR-013 CLI de SisyFlow]]).

## Esquema

Ver `[[Modelo de datos objetivo (Supabase)]]` y `[[ADR-007 Jerarquia Epicas Proyectos Tareas]]`.
La vista `daily_epic_logs` alimenta la gamificación (`[[Gamificacion]]`).

## Reglas

- Toda tabla con `user_id` y RLS `auth.uid() = user_id` (US 1.1). Probar con dos usuarios.
- Migraciones inmutables: una migración aplicada no se edita; se crea otra.
- Seed idempotente y solo para desarrollo.
- `service_role` jamás en la app de escritorio: la app usa `anon key` + RLS.
- Secretos solo en `.env` (gitignored) o Supabase Secrets.
- Cargar skills antes de codificar: `supabase`, `supabase-postgres-best-practices`.
- Vault antes/después de cada tarea; commits `feat(backend)`.

## DoD

- Migraciones aplicadas en local (`supabase db reset` limpio).
- RLS probada con dos usuarios.
- Tipos TypeScript regenerados para el desktop.
- Vault actualizado (nota + MOC).

> Cumplido en la Fase 2 (2026-09-13): reset limpio, 22 tests de RLS en verde,
> advisors sin issues y tipos regenerados.
>
> Fases posteriores (2026-09-13): la suite pgTAP creció a 27 aserciones
> (jerarquía), 38 (gamificación) y 47 (racha global, migración
> `20260913224500_global_streak.sql`, 9 aserciones).
>
> Tareas recurrentes (2026-09-20, US 4.1, ADR-014): migración
> `20260920120000_recurring_todos.sql` (enum `todo_recurrence`, tabla
> `todo_completions`, trigger de integridad y unión en la gamificación) y
> `recurring_test.sql` (12 aserciones; 61 en total).
