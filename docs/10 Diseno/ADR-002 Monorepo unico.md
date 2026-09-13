---
tags: [adr, decision, monorepo]
status: Aceptado
date: 2026-09-13
---

# ADR-002 Monorepo único

## Status

Aceptado

## Contexto

SisyFlow consta de tres artefactos que evolucionan juntos: la app de escritorio,
el backend Supabase y el vault de documentación. Las user stories tocan app y
backend a la vez (p. ej. US 1.1–1.3 de autenticación y migración), y el workflow
de IA necesita acceso a todo el contexto en una sola sesión.

## Decisión

Un único repositorio git `sisyflow-apps` con:

| Ruta | Contenido |
| --- | --- |
| `apps/desktop/` | App Electron |
| `backend/supabase/` | Backend Supabase (CLI, migraciones, seed) |
| `docs/` | Vault Obsidian (fuente de verdad) |
| `.opencode/`, `.agents/` | Harness de IA (agentes, comandos, skills) |

Reglas asociadas:

- Workspace pnpm (`pnpm-workspace.yaml`) cuando exista código JS en `apps/desktop`.
- Commits atómicos con scope por artefacto: `feat(desktop)`, `feat(backend)`,
  `docs(vault)`, `chore(repo)`.
- Un solo `.gitignore` raíz; `backend/supabase/` mantiene sus propias exclusiones
  para temporales del CLI.

## Consecuencias

### Positivas

- Un solo clon y una sola sesión de OpenCode cubren app, backend y documentación.
- Commits atómicos feature-completos (UI + migración SQL + nota del vault).
- El harness puede referenciar el vault como contexto (`references.vault` en `opencode.json`).

### Negativas / Trade-offs

- Repo único acopla el versionado de artefactos independientes (trade-off aceptado
  a cambio de trazabilidad).
- El CI (si se agrega) deberá filtrar por rutas para no correr todo en cada cambio.

### Neutrales

- Los repos de origen (TodoDex y la prueba técnica Imagine) no se enlazan como
  submódulos ni conservan su historia git: se copia el contenido, no la historia.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-003 Vault Obsidian como fuente de verdad]], [[ADR-004 Base de escritorio TodoDex a SisyFlow]]
- **Afecta a:** [[Fases del proyecto]], [[Convenciones git y commits]]
- **Repo:** `.` (raíz del monorepo)
