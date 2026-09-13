---
description: Fase 2 — inicializa Supabase con esquema objetivo, RLS y auth base
agent: build
---

Fase 2 del proyecto con ciclo RPI. Alcance: US 1.1 (base de datos y auth) y el esquema completo.

1. **Research.** Lee `docs/20 Tecnico/Modelo de datos objetivo (Supabase).md`, `docs/20 Tecnico/Backend Supabase.md`, `ADR-005` y `ADR-007`. Carga `supabase` y `supabase-postgres-best-practices`.
2. **Plan (antes de escribir SQL).** Confirma el esquema final. Resuelve `ADR-007 Jerarquia Epicas Proyectos Tareas` (Propuesto → Aceptado o ajustado) con el mapeo proyecto→épica. Si hay decisiones nuevas, crea el ADR con `/adr`.
3. **Implement.**
   - `supabase init` dentro de `backend/` (crea `backend/supabase/`).
   - Migraciones: enums, `epics`, `projects`, `todos`, `tags`, índices, vista `daily_epic_logs` (`security_invoker = true`) y políticas RLS (`auth.uid() = user_id`).
   - `seed.sql` idempotente con datos de ejemplo.
4. **Verificación.** `supabase db reset` limpio; RLS probada con **dos usuarios** (ninguno accede a datos del otro).
5. **Cierre.** Actualiza notas + MOC y reporta migraciones, pruebas y decisiones. Commit `feat(backend)`.
