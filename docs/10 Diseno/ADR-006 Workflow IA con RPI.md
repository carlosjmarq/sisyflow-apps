---
tags: [adr, decision, workflow-ia]
status: Aceptado
date: 2026-09-13
---

# ADR-006 Workflow IA con RPI

## Status

Aceptado

## Contexto

El proyecto se desarrolla con asistencia intensiva de IA en sesiones cortas.
Sin un contrato explícito, cada sesión re-descubre el contexto, toma decisiones
inconsistentes y no deja memoria. El proyecto de referencia `Prueba-Tecnica-Imagine`
validó un harness reproducible: fases ordenadas, agentes especializados, comandos
y vault Obsidian como memoria.

## Decisión

Adoptar el harness adaptado a SisyFlow:

- **`AGENTS.md` raíz** como contrato general + un `AGENTS.md` por carpeta
  (`apps/desktop`, `backend`, `docs`) con convenciones y comandos.
- **Subagentes** en `.opencode/agent/`: `desktop` (Electron/React), `backend`
  (Supabase), `docs` (vault). Permisos mínimos por allowlist de comandos.
- **Comandos slash** en `.opencode/command/`: fases `/setup`, `/desktop`,
  `/backend`, `/cloud`, `/hierarchy`, `/gamification`, `/deliver` + utilidades
  `/adr`, `/nota`.
- **Skills de dominio** en `.agents/skills/` (gestionadas con `npx skills`),
  cargadas ANTES de codificar el dominio correspondiente.
- **Ciclo RPI obligatorio** por fase y feature ([[RPI Research Plan Implement]]):
  Research → Plan (ADR/nota antes del código) → Implement (con validación).
- **Vault como memoria** ([[ADR-003 Vault Obsidian como fuente de verdad]]):
  toda tarea lee la nota relacionada antes y la actualiza después.
- Cada tarea cierra con reporte: archivos tocados, pruebas ejecutadas y decisiones tomadas.

## Consecuencias

### Positivas

- Sesiones reproducibles: mismo orden, mismas convenciones, calidad estable.
- Las decisiones quedan documentadas y enlazadas (ADR + notas).
- Los permisos acotados de subagentes reducen acciones accidentales.

### Negativas / Trade-offs

- Overhead de documentación en cada tarea (intencional).
- Los comandos y agentes deben evolucionar cuando cambie el stack.

### Neutrales

- El harness vive en el repo (`.opencode/`, `.agents/`) y se versiona con el código.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-003 Vault Obsidian como fuente de verdad]]
- **Afecta a:** [[Workflow IA]], [[RPI Research Plan Implement]], `AGENTS.md` de cada carpeta
- **Repo:** `.opencode/`, `.agents/`, `opencode.json`
