---
description: Fase 4 — jerarquía Épicas > Proyectos > Tareas (US 2.1–2.3)
agent: build
---

Fase 4 del proyecto con ciclo RPI. Alcance: US 2.1–2.3.

1. **Research.** Lee `ADR-007 Jerarquia Epicas Proyectos Tareas`, `docs/20 Tecnico/Modelo de datos objetivo (Supabase).md` y `Paridad funcional con TodoDex`. Carga `supabase`, `vercel-react-best-practices` y `sisyflow-db`.
2. **Plan.** Resuelve los puntos abiertos del ADR-007 (mapeo de proyectos con varias épicas, UI de agrupación) y pásalo a Aceptado. Documenta antes de codificar.
3. **Implement.**
   - Migración: ajustes de esquema si el ADR lo define; migración de datos de épicas actuales (texto por proyecto) a Épicas top-level deduplicadas.
   - **US 2.1:** CRUD completo de Épicas con color hex; sin botón de completar.
   - **US 2.2:** proyectos asignados obligatoriamente a una Épica, con estado (`active`, `paused`, `completed`); pausar/completar oculta tareas incompletas sin borrar historial.
   - **US 2.3:** creación de tareas dentro de un proyecto; indicador de color de la Épica; `completed_at` automático al completar.
4. **Paridad.** Verifica que estados, prioridad, urgencia, vencimiento, tags, filtros y editor sigan funcionando.
5. **Cierre.** Actualiza notas + MOC; checklist de paridad de la fase. Commit atómico.
