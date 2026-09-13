---
tags: [adr, decision, datos, jerarquia]
status: Propuesto
date: 2026-09-13
---

# ADR-007 Jerarquía Épicas > Proyectos > Tareas

## Status

Aceptado — implementado en la Fase 2 (2026-09-13). El mapeo de migración
proyecto→épica se aplica en la Fase 3 (`/cloud`).

## Contexto

El modelo actual de TodoDex ([[App de escritorio (base TodoDex)]]) trata las
épicas como etiquetas por proyecto (`epics.projectId` + nombre) y las tareas
como registros planos con `status`, `priority`, `urgency`, `expirationDate`,
`content` (BlockNote) y tags por proyecto.

Las US 2.1–2.3 piden otra estructura:

- **US 2.1:** Épicas como áreas de vida continuas (`epics`: `user_id`, `name`,
  `color_code`), sin botón de completar.
- **US 2.2:** Proyectos finitos que **pertenecen obligatoriamente a una Épica**,
  con `status` (`active`, `paused`, `completed`). Pausar/completar oculta tareas
  incompletas del día a día sin alterar el historial.
- **US 2.3:** Tareas dentro de un proyecto, con `completed_at` automático al
  completarse y color de la Épica como indicador visual.

El guardrail de paridad exige conservar las capacidades actuales de los todos
(status extendido, prioridad, urgencia, vencimiento, tags, orden/filtros) y del
editor ([[Paridad funcional con TodoDex]]).

## Decisión

1. Adoptar la jerarquía **Épica > Proyecto > Tarea** en el esquema Supabase
   ([[Modelo de datos objetivo (Supabase)]]).
2. Conservar en `todos` los campos actuales de paridad. `completed_at` se asigna
   automáticamente al pasar a estado completado y se limpia al salir de él
   (`is_completed` ≡ `status = 'done'`, derivado, no un campo separado).
3. Migración de datos existentes (Sísifo, US 1.2):
   - Épicas actuales (nombre por proyecto) se convierten en Épicas top-level
     deduplicadas por nombre.
   - Cada proyecto se asigna a una Épica. **Punto abierto:** hoy un proyecto
     puede tener varias épicas; propuesta inicial: asignar la más antigua y
     reportar los casos ambiguos en el informe de migración.
   - El campo `todos.epic` (texto) se usa para validar el mapeo y luego se retira.
4. La UI del desktop agrupa proyectos por Épica y colorea las tareas con el
   `color_code` de su épica.

## Consecuencias

### Positivas

- Modelo coherente con la filosofía (áreas de vida continuas vs. proyectos finitos).
- Habilita la gamificación por épica ([[Gamificacion]]): heatmap y rachas
  dependen de `epic_id` + `completed_at`.
- Pausar/completar proyectos sin borrar historial mantiene las rachas intactas.

### Negativas / Trade-offs

- Migración no trivial: cambio de cardinalidad de épicas (varias por proyecto →
  una por proyecto).
- Toda la UI de proyectos cambia de "lista plana" a "agrupada por Épica".

### Neutrales

- Las Épicas no tienen estado de completado ni fecha de fin (son continuas).
- Los tags siguen siendo por proyecto, como hoy.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-004 Base de escritorio TodoDex a SisyFlow]], [[ADR-008 Estrategia de datos nube-first]], [[US's for personal development project]]
- **Afecta a:** [[Modelo de datos objetivo (Supabase)]], [[Paridad funcional con TodoDex]], [[Gamificacion]]
- **Repo:** `backend/supabase/migrations/`, `apps/desktop/src/`
