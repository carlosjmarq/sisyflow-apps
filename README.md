# SisyFlow Apps

Monorepo de **SisyFlow**: suite personal de escritorio para empujar la roca todos los días. Gestión de tareas organizada por áreas de vida (Épicas), proyectos finitos y rachas diarias inspiradas en el método Seinfeld.

> "El acto mismo de empujar la roca hacia la cima basta para llenar el corazón del hombre."

## Estado

**Fase 2 — Backend** completada: Supabase local con esquema (épicas, proyectos,
tareas, tags), RLS verificada (22 tests pgTAP), seed de desarrollo y tipos
TypeScript generados. La app Electron vive en `apps/desktop/` con paridad de
TodoDex verificada. Siguiente fase: `/cloud` (cliente, login y migración Sísifo).

## Estructura

| Ruta | Contenido |
| --- | --- |
| `apps/desktop/` | App Electron (React + TypeScript + Tailwind + BlockNote; Dexie solo como origen de migración) |
| `backend/supabase/` | Backend Supabase (Postgres, Auth, RLS, migraciones, funciones) |
| `docs/` | Vault Obsidian: fuente de verdad del proyecto (ADRs, notas técnicas, user stories, proceso) |
| `.opencode/` | Agentes y comandos del workflow de IA |
| `.agents/skills/` | Skills de dominio (gestionadas con `npx skills`) |

## Workflow de IA

El proyecto se construye por fases con el ciclo **RPI (Research → Plan → Implement)** y comandos de OpenCode:

| Fase | Comando | Contenido |
| --- | --- | --- |
| 0 | — | Andamiaje (vault + harness) |
| 1 | `/desktop` | Migrar TodoDex → SisyFlow preservando paridad funcional |
| 2 | `/backend` | Supabase: esquema, RLS, auth base |
| 3 | `/cloud` | Cliente Supabase, login, migración de datos locales, UI optimista |
| 4 | `/hierarchy` | Épicas > Proyectos > Tareas |
| 5 | `/gamification` | Heatmap, rachas, weekend freeze |
| 6 | `/deliver` | Builds, documentación final, checklist |

Documentación completa del proceso: `docs/40 Proceso/`. Punto de entrada del vault: `docs/00 Inbox/MOC.md` (abrir `docs/` como vault en Obsidian).

## Requisitos

- Node 20+ (verificado con 24.14.1) y pnpm 9
- Docker (para Supabase local)
- Supabase CLI (verificado con 2.98.2)
- Git

Detalle y versiones exactas: `docs/40 Proceso/Setup y herramientas.md`.

## Primeros pasos

1. Abrir el repo con OpenCode (el `opencode.json` carga AGENTS.md y las skills del proyecto).
2. `pnpm install` en la raíz (workspace) y `pnpm dev` para levantar la app de escritorio.
3. Continuar con `/cloud` (fase 3) según `docs/40 Proceso/Fases del proyecto.md`.
