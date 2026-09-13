# backend — Supabase

Backend de SisyFlow: Supabase (Postgres + Auth + RLS). Parte del monorepo `sisyflow-apps` ([[ADR-002 Monorepo unico]]).

> Estado (Fase 0): carpeta declarada. El proyecto Supabase se inicializa en la fase `/backend` (`supabase init` dentro de `backend/`).

## Stack

- Supabase CLI + Docker (desarrollo local)
- Postgres (imagen gestionada por el CLI)
- Auth email/contraseña (US 1.1)
- RLS obligatoria en todas las tablas
- Edge Functions solo si un ADR lo justifica
- Tipos TypeScript generados para `apps/desktop`

## Estructura esperada

```
backend/
└── supabase/
    ├── config.toml
    ├── migrations/      # migraciones SQL inmutables
    ├── functions/       # edge functions (solo justificadas)
    └── seed.sql         # datos de desarrollo idempotentes
```

## Comandos (dev)

```
supabase start                       # levanta el stack local (Docker)
supabase status                      # URLs y claves locales
supabase migration new <nombre>      # crea migración
supabase db reset                    # recrea DB local + seed
supabase db push                     # aplica migraciones al remoto
supabase gen types typescript --local # tipos TS para el desktop
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
