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
    ├── migrations/      # 20260913191443_initial_schema.sql
    ├── tests/           # rls_test.sql (pgTAP, 22 aserciones)
    ├── functions/       # edge functions (vacío; solo con ADR)
    └── seed.sql         # usuarios de prueba + datos de ejemplo
```

## Comandos (dev)

```
supabase start                        # stack local (puertos 453xx)
supabase status                       # URLs y claves locales
supabase migration new <nombre>       # crea migración
supabase db reset                     # recrea DB local + seed
supabase test db                      # tests pgTAP (RLS)
supabase db advisors --local          # issues de seguridad/performance
supabase db push                      # aplica migraciones al remoto
```

Para regenerar tipos (en Windows, el redirect de PowerShell 5.1 escribe UTF-16;
usar `cmd /c`):

```
cmd /c "supabase gen types typescript --local > ..\apps\desktop\src\types\supabase.ts"
```

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
