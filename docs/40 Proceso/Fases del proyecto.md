---
tags: [proceso, fases, roadmap]
status: permanente
date: 2026-09-13
---

# Fases del proyecto

## Contexto

Roadmap de SisyFlow. Las fases se ejecutan **siempre en orden**, cada una con el
ciclo [[RPI Research Plan Implement]] y cerrando con vault actualizado y
verificación verde. Cada fase tiene su comando de OpenCode.

## Contenido

| Fase | Comando | Contenido | US | Estado |
| --- | --- | --- | --- | --- |
| 0 — Andamiaje | — | Monorepo, vault y harness IA | — | ✅ 2026-09-13 |
| 1 — Desktop base | `/desktop` | Copiar TodoDex → SisyFlow, renombre, paridad verificada | transversal | ✅ 2026-09-13 |
| 2 — Backend | `/backend` | `supabase init`, esquema objetivo, RLS, auth base | 1.1 | ✅ 2026-09-13 |
| 3 — Nube | `/cloud` | Cliente Supabase, login/registro, migración Sísifo, UI optimista | 1.1–1.3 | ⏳ pendiente |
| 4 — Jerarquía | `/hierarchy` | Épicas > Proyectos > Tareas, colores, `completed_at`; resolver ADR-007 | 2.1–2.3 | ⏳ pendiente |
| 5 — Gamificación | `/gamification` | `daily_epic_logs`, heatmap, rachas, weekend freeze | 3.1–3.4 | ⏳ pendiente |
| 6 — Entrega | `/deliver` | Builds, READMEs, checklist final | — | ⏳ pendiente |

### Cierre de fase (checklist)

- [ ] Definition of Done de la fase cumplido (lint, typecheck, migraciones, RLS).
- [ ] Guardrail de paridad sin regresiones ([[Paridad funcional con TodoDex]]).
- [ ] Notas del vault actualizadas + MOC al día.
- [ ] ADRs de la fase en estado correcto (Propuesto → Aceptado).
- [ ] Reporte final: archivos, pruebas, decisiones.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[RPI Research Plan Implement]], [[Workflow IA]]
- **ADR:** [[ADR-002 Monorepo unico]], [[ADR-006 Workflow IA con RPI]]
