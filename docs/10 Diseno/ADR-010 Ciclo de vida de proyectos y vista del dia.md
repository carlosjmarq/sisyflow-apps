---
tags: [adr, decision, jerarquia, ux]
status: Propuesto
date: 2026-09-13
---

# ADR-010 Ciclo de vida de proyectos y vista del día

## Status

Aceptado — implementado y verificado en la Fase 4 (2026-09-13).

## Contexto

US 2.2 pide proyectos con estado (`active`, `paused`, `completed`): pausar o
completar un proyecto debe ocultar sus tareas incompletas de la vista del día a
día, sin tocar el historial (las rachas dependen de `completed_at`,
[[Gamificacion]]). Además pide que la vista principal permita agrupar las tareas
por proyecto activo.

Estado de partida (Fase 3):

- `projects.status` existe en el esquema pero la UI no lo edita ni lo muestra.
- La FK `projects.epic_id` es `on delete cascade`: borrar una épica eliminaría
  sus proyectos y tareas (peligroso para el historial).
- Home muestra una grilla plana de tarjetas; no hay vista de tareas del día.

## Decisión

1. **Estado del proyecto**: se edita en el formulario de proyecto
   (Activo / Pausado / Completado), con etiqueta visible en la tarjeta. El alta
   crea proyectos `active`.
2. **Vista del día**: Home agrega un selector "Proyectos / Tareas del día". La
   vista de tareas lista las tareas pendientes (`status` distinto de `done` y
   `cancelled`) **solo de proyectos activos**, agrupadas por proyecto (con su
   color y épica). Pausar o completar un proyecto lo excluye de esa vista sin
   borrar nada.
3. **Agrupación por épica**: en la vista de proyectos, las tarjetas se agrupan
   bajo el encabezado de su épica (punto de color + nombre). Las épicas sin
   proyectos no se muestran en Home.
4. **Borrado de épicas**: nueva migración que cambia la FK a
   `on delete restrict`. Si la épica tiene proyectos, el borrado falla y la UI
   lo explica (mover los proyectos primero). El CRUD de épicas vive en la
   pantalla `/epics`.
5. **Historial visible**: el drawer de tarea muestra "Completado el …" cuando
   `completed_at` existe (US 2.3).

## Consecuencias

### Positivas

- El día a día muestra solo lo accionable (proyectos activos), como pide la
  filosofía de la app.
- El historial y las rachas quedan intactos: pausar/completar no borra nada.
- Imposible perder proyectos/tareas por borrar una épica desde la UI.

### Negativas / Trade-offs

- La vista de proyectos se vuelve jerárquica (más densa) y requiere un encabezado
  por épica.
- Borrar una épica exige mover sus proyectos antes (fricción intencional).

### Neutrales

- `backlog` sigue siendo un estado de tarea, no de proyecto.
- La vista del día no incluye tareas de proyectos pausados aunque estén vencidas.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-007 Jerarquia Epicas Proyectos Tareas]], [[ADR-008 Estrategia de datos nube-first]]
- **Afecta a:** [[Modelo de datos objetivo (Supabase)]], [[Capa de datos Supabase]], [[App de escritorio (base TodoDex)]], [[Paridad funcional con TodoDex]]
- **Repo:** `backend/supabase/migrations/`, `apps/desktop/src/`
