---
description: Prepara el workspace pnpm y verifica las fundaciones del monorepo
agent: build
---

Fundaciones del monorepo (previa a `/desktop`), con ciclo RPI.

1. **Research.** Lee `docs/10 Diseno/` (ADRs 001–008), `docs/40 Proceso/Fases del proyecto.md` y verifica la estructura actual: `apps/desktop/`, `backend/supabase/`, `docs/`.
2. **Plan.** Confirma con el usuario el alcance: workspace pnpm en la raíz (`pnpm-workspace.yaml` con `packages: apps/*`), `package.json` raíz privado y `.npmrc` con `node-linker=hoisted`.
3. **Implement.**
   - Crea los archivos del plan si no existen.
   - Verifica que `apps/desktop/AGENTS.md`, `backend/AGENTS.md` y `docs/AGENTS.md` existan y sean coherentes con el contrato raíz.
   - Verifica que no haya notas huérfanas en el vault (todas enlazadas desde el MOC).
4. Actualiza las notas afectadas y cierra con reporte (archivos creados, verificación, siguiente fase `/desktop`).
