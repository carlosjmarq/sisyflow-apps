# SisyFlow Apps — Workflow de IA

SisyFlow es una suite personal de escritorio para empujar la roca todos los días:
gestión de tareas por áreas de vida (Épicas), proyectos finitos y rachas diarias
inspiradas en el método Seinfeld. App Electron + backend Supabase, con un vault
Obsidian como memoria del proyecto.

> "El acto mismo de empujar la roca hacia la cima basta para llenar el corazón del hombre."

## Objetivo del workflow

Este harness (adaptado de `Prueba-Tecnica-Imagine`) estandariza cómo la IA y el
equipo trabajan: misma estructura, misma documentación, mismas fases, calidad
reproducible. Toda decisión, funcionalidad e infraestructura se documenta en el
vault (`docs/`, ver `[[00 Inbox/MOC]]`).

## Arquitectura: monorepo único

| Ruta | Contenido |
| --- | --- |
| `apps/desktop/` | App Electron (React + TypeScript + Tailwind + BlockNote; Dexie solo como origen de migración) |
| `backend/supabase/` | Backend Supabase (Postgres, Auth, RLS, migraciones, funciones) |
| `docs/` | Vault Obsidian (fuente de verdad: ADRs, notas técnicas, user stories) |
| `.opencode/` | Agentes y comandos del workflow IA |
| `.agents/skills/` | Skills de dominio (gestionadas con `npx skills`) |

Reglas:

- Commits atómicos: un cambio de feature toca app + backend + docs en un mismo commit.
- Scopes por artefacto: `feat(desktop)`, `feat(backend)`, `docs(vault)`, `chore(repo)`.
- Cada carpeta tiene su `AGENTS.md` con convenciones y comandos.

## Fases del proyecto

Ejecutar SIEMPRE en orden. Cada fase termina con documentación actualizada y
verificación verde. Cada fase y cada feature aplica el ciclo **RPI
(Research → Plan → Implement)**: investigar y cargar skills → documentar la
decisión (ADR/nota) → implementar y validar. Ver `[[40 Proceso/RPI Research Plan Implement]]`.

| Fase | Comando | Contenido | US |
| --- | --- | --- | --- |
| 0 — Andamiaje | — | Monorepo, vault y harness IA | — |
| 1 — Desktop base | `/desktop` | Copiar TodoDex → SisyFlow con paridad funcional | transversal |
| 2 — Backend | `/backend` | Supabase init, esquema objetivo, RLS, auth base | 1.1 |
| 3 — Nube | `/cloud` | Cliente Supabase, login, migración Sísifo, UI optimista | 1.1–1.3 |
| 4 — Jerarquía | `/hierarchy` | Épicas > Proyectos > Tareas, colores, `completed_at` | 2.1–2.3 |
| 5 — Gamificación | `/gamification` | `daily_epic_logs`, heatmap, rachas, weekend freeze | 3.1–3.4 |
| 6 — Entrega | `/deliver` | Builds, READMEs, checklist final | — |

El backlog de user stories vive en `[[US's for personal development project]]`
(`docs/00 Inbox/`). Las US se agregan ahí y se promueven a nota/ADR cuando se diseñan.

## Guardrail de paridad (obligatorio)

La migración a SisyFlow conserva TODAS las funcionalidades actuales de TodoDex
sobre todos y editor de contenido. Inventario y checklist en
`[[Paridad funcional con TodoDex]]`. Ninguna fase puede romperlas sin un ADR que
las superseda explícitamente.

## Estrategia de datos (ADR-008)

Nube-first con UI optimista: Supabase es la fuente de verdad; IndexedDB (Dexie)
queda solo como origen de la migración Sísifo (US 1.2). Toda mutación actualiza
la UI de inmediato y revierte con aviso si la red falla (US 1.3). Ver
`[[ADR-008 Estrategia de datos nube-first]]`.

## Reglas de documentación (vault Obsidian)

- Cada tarea toca el vault: **antes** de implementar, leer la nota relacionada; **después**, actualizarla.
- Toda decisión de diseño significativa crea un **ADR** en `docs/10 Diseno/` (formato Nygard).
- Notas nuevas: plantilla `[[Nota]]`; ADRs: plantilla `[[ADR]]`.
- Wikilinks por nombre de archivo sin extensión, ej. `[[ADR-005 Supabase como backend]]`.
- El MOC siempre al día y sin notas huérfanas.
- Prosa en español, clara y completa. Nada de caveman en contenido persistido.

## Convenciones de código

- Desktop: Electron 30 + Vite 5 + React 18 + TypeScript estricto + Tailwind 3 +
  BlockNote/Mantine. pnpm con `node-linker=hoisted`. Sin store global: hooks +
  capa de datos.
- Backend: Supabase (Postgres + Auth email/contraseña + RLS). Migraciones vía
  CLI; tipos TypeScript generados para el desktop. `service_role` jamás en la app.
- Todo acceso a datos desde la app pasa por RLS `auth.uid() = user_id` (US 1.1).
- Secretos solo en `.env` (gitignored); nunca en el repo.

## Calidad (Definition of Done)

- Desktop: `pnpm lint` y `npx tsc --noEmit` verdes; `pnpm dev` levanta la app.
- Paridad TodoDex intacta (checklist de la nota de paridad).
- Backend: migraciones aplicadas en local, RLS probada con dos usuarios, tipos regenerados.
- Vault actualizado (nota + MOC) y README si cambió el uso.

## Skills del proyecto

Instaladas a nivel proyecto en `.agents/skills/` (gestionadas con `npx skills`):
`supabase`, `supabase-postgres-best-practices`, `vercel-react-best-practices`,
`electron-dev`, `obsidian`, `frontend-design`, `sisyflow-db`.

Cargar la skill correspondiente ANTES de escribir código del dominio (herramienta `skill`).
