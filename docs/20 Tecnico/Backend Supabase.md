---
tags: [tecnico, backend, supabase, auth, rls]
status: borrador
date: 2026-09-13
---

# Backend Supabase

## Contexto

Backend de SisyFlow según [[ADR-005 Supabase como backend]]: Postgres + Auth
email/contraseña + RLS, consumido directo desde la app Electron con
`@supabase/supabase-js` (publishable key). El proyecto Supabase vive en
`backend/supabase/` (inicializado en la Fase 2).

## Contenido

### Estado actual (Fase 2, 2026-09-13)

- Migración inicial aplicada: enums, `epics`, `projects`, `todos`, `tags`,
  índices, trigger de timestamps, vista `daily_epic_logs` y RLS.
- Seed de desarrollo con dos usuarios: `ana@example.com` y `beto@example.com`
  (contraseña `password123`).
- RLS verificada con tests pgTAP (`backend/supabase/tests/rls_test.sql`,
  22 aserciones) — `supabase test db` en verde.
- Tipos TypeScript generados en `apps/desktop/src/types/supabase.ts`.
- Fase 4: segunda migración (`epic_delete_restrict`) para bloquear el borrado de
  épicas con proyectos; tests pgTAP de jerarquía (27 en total, `supabase test db`).
- Fase 5: migración `gamification_rpc` con `daily_epic_logs_tz` y `epic_streaks`;
  tests pgTAP de gamificación (38 en total).
- Rediseño ([[ADR-012 Rediseno UI Material Design 3]]): migración
  `global_streak` con `streak_global`; tests pgTAP de racha global (47 en total).
- **Producción (2026-09-13)**: proyecto remoto `sisyflow`
  (ref `djjttyejsbicmrvmgyep`, us-east-1) con las 4 migraciones aplicadas vía
  `supabase link` + `supabase db push` ([[Supabase local y remoto]]).
- Stack local en puertos 453xx por restricciones de Windows
  ([[Supabase local y remoto]]).

### Autenticación (US 1.1)

- Registro e inicio de sesión con **email y contraseña**.
- **Sesión persistente en Electron**: el cliente mantiene la sesión entre
  aperturas (persistencia en almacenamiento local; verificar comportamiento con
  el esquema `file://` del build).
- Confirmación por email activada (`enable_confirmations = true`): el enlace del
  correo vuelve a la app por deep link (`sisyflow://auth/callback`, ver
  [[Builds de escritorio (Windows)]]) y establece la sesión automáticamente.
- La pantalla de login permite **reenviar el correo de confirmación** cuando el
  error es `Email not confirmed` y avisa ante el límite de envíos de Supabase.
- Pantalla de Login/Registro en el desktop (fase `/cloud`).
- Al registrarse, los datos creados por el usuario llevan `user_id = auth.uid()`.

### RLS (obligatoria)

- Todas las tablas tienen `user_id uuid` y políticas para `select`, `insert`,
  `update` y `delete` con `auth.uid() = user_id`.
- La vista `daily_epic_logs` usa `security_invoker = true` para respetar RLS.
- Verificación: probar cada tabla con **dos usuarios** y confirmar que ninguno
  lee ni escribe datos del otro.
- La anon key es la única credencial en la app; `service_role` jamás se incluye
  (ver `apps/desktop/AGENTS.md`).

### Estructura y flujo de migraciones

```
backend/supabase/
├── config.toml        # configuración local del stack
├── migrations/        # SQL inmutable, una migración por cambio
├── functions/         # edge functions (solo si un ADR lo justifica)
└── seed.sql           # datos de ejemplo para desarrollo (idempotente)
```

- `supabase start` levanta el stack local con Docker; `supabase db reset` recrea
  la base y aplica migraciones + seed.
- Las migraciones aplicadas no se editan: se crea una nueva.
- Tipos TypeScript: `supabase gen types typescript --local` → consumidos por el desktop.

### Secretos

- Desarrollo: `.env` (gitignored) con URL y publishable key locales.
- Desktop: variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`
  (la publishable key es pública por diseño, pero se maneja por entorno).
- Producción: `apps/desktop/.env.production` (gitignored) con el proyecto
  remoto `sisyflow` ([[Supabase local y remoto]]).

### Flujo de datos desde el desktop

Toda lectura/escritura operativa pasa por el cliente Supabase con UI optimista
([[ADR-008 Estrategia de datos nube-first]]). IndexedDB solo se usa en la
migración Sísifo (US 1.2).

## Pendientes

- [x] `supabase init` y primera migración (Fase 2, 2026-09-13).
- [x] Cliente integrado en el desktop con la publishable key y sesión
      persistente (Fase 3, 2026-09-13).
- [x] Proyecto remoto de producción creado y migrado (2026-09-13:
      `sisyflow`, ref `djjttyejsbicmrvmgyep`, us-east-1).
- [x] Migración de tareas recurrentes (US 4.1, ADR-014) aplicada en local
      (2026-09-20): `db reset` limpio, 61 tests pgTAP en verde y advisors sin
      issues; pendiente `db push` al remoto ([[Supabase local y remoto]]).

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Modelo de datos objetivo (Supabase)]], [[Supabase local y remoto]]
- **ADR:** [[ADR-005 Supabase como backend]], [[ADR-008 Estrategia de datos nube-first]]
- **Ruta en el monorepo:** `backend/supabase/`
