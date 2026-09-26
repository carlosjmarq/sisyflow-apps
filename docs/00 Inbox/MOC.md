---
tags: [moc, indice]
status: permanente
date: 2026-09-13
---

# MOC — SisyFlow Apps

Punto de entrada al vault. Toda nota nueva se enlaza aquí.

> "El acto mismo de empujar la roca hacia la cima basta para llenar el corazón del hombre."
> Objetivo: mantener viva la cadena diaria de progreso (streak) organizada por áreas de vida (Épicas).

## Estado del proyecto

**Fases 0–5 completas** (2026-09-13): andamiaje, desktop base, backend, nube,
jerarquía Épica > Proyecto > Tarea y gamificación (heatmap, rachas por épica con
weekend freeze y cálculo en SQL según la zona horaria del cliente). Sobre esa
base se implementó el **rediseño UI Material Design 3** ([[ADR-012 Rediseno UI Material Design 3]]):
Inicio progress-first (hero de racha, heatmap compacto expandible, chips de racha
por épica, tareas del día y proyectos), dark mode persistido, búsqueda global y
gestión de tags por proyecto con UI. La **Fase 6 — Entrega** (`/deliver`) está en
curso: el backend se desplegó en el proyecto Supabase de producción `sisyflow`
(us-east-1) y se generó el primer instalador NSIS apuntando a producción
([[Supabase local y remoto]], [[Builds de escritorio (Windows)]]). Además se
añadió el **CLI de SisyFlow** (`apps/cli/`, binario `sisyflow`) para automatizar
el CRUD de épicas, proyectos y tareas desde la consola ([[ADR-013 CLI de SisyFlow]]).
Sobre esa base se implementaron las **tareas recurrentes** (US 4.1, 2026-09-20):
periodicidad por tarea y un historial de completados que alimenta el heatmap y
las rachas ([[ADR-014 Tareas recurrentes]]). También se creó la **app móvil
Flutter para Android** con paridad funcional (US 5.1, [[ADR-015 App movil Flutter (Android)]],
[[App móvil (Flutter)]]).
El roadmap de fases vive en [[Fases del proyecto]].

## 00 Inbox

- [[US's for personal development project]] — backlog de producto: US 1.1–3.4 (nube, jerarquía, gamificación)
- [[MOC]] — este índice

## 10 Diseno (decisiones)

- [[ADR-001 Eleccion de stack]]
- [[ADR-002 Monorepo unico]]
- [[ADR-003 Vault Obsidian como fuente de verdad]]
- [[ADR-004 Base de escritorio TodoDex a SisyFlow]]
- [[ADR-005 Supabase como backend]]
- [[ADR-006 Workflow IA con RPI]]
- [[ADR-007 Jerarquia Epicas Proyectos Tareas]] — Propuesto
- [[ADR-008 Estrategia de datos nube-first]]
- [[ADR-009 Migracion Sísifo mapeo y marcador]]
- [[ADR-010 Ciclo de vida de proyectos y vista del dia]]
- [[ADR-011 Gamificacion zona horaria rachas y heatmap]]
- [[ADR-012 Rediseno UI Material Design 3]]
- [[ADR-013 CLI de SisyFlow]] — Aceptado
- [[ADR-014 Tareas recurrentes]] — Aceptado
- [[ADR-015 App movil Flutter (Android)]] — Aceptado

## 20 Tecnico

- [[App de escritorio (base TodoDex)]]
- [[App móvil (Flutter)]]
- [[CLI de SisyFlow]]
- [[Capa de datos Supabase]]
- [[Paridad funcional con TodoDex]]
- [[Modelo de datos objetivo (Supabase)]]
- [[Backend Supabase]]
- [[Editor de contenido (BlockNote)]]
- [[Gamificacion]]

## 30 Infraestructura

- [[Supabase local y remoto]]
- [[Builds de escritorio (Windows)]]

## 40 Proceso

- [[RPI Research Plan Implement]]
- [[Fases del proyecto]]
- [[Setup y herramientas]]
- [[Convenciones git y commits]]
- [[Workflow IA]]

## 90 Recursos

- [[ADR]] — plantilla de ADR
- [[Nota]] — plantilla de nota
- `assets/` — adjuntos y diagramas

## Relaciones

- **Repo:** `docs/` (este vault), `AGENTS.md`, `opencode.json`
