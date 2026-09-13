---
description: Fase 3 — cliente Supabase, login, migración Sísifo y UI optimista (US 1.1–1.3)
agent: build
---

Fase 3 del proyecto con ciclo RPI. Alcance: US 1.1–1.3 del backlog (`US's for personal development project`).

1. **Research.** Lee `docs/20 Tecnico/Backend Supabase.md`, `ADR-005`, `ADR-008` y la US 1.1–1.3. Carga `supabase`, `vercel-react-best-practices` y `sisyflow-db` (migración desde Dexie).
2. **Plan.** Define: manejo de sesión persistente en Electron, pantalla de Login/Registro, pantalla de Settings con "Migrar datos locales", y el patrón de mutación optimista con reversión. Documenta los detalles en las notas antes de codificar.
3. **Implement.**
   - Cliente `@supabase/supabase-js` inicializado con variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
   - Login/Registro funcional; sesión persistente entre aperturas de la app.
   - **Migración Sísifo (US 1.2):** botón en Settings que lee Dexie, mapea al esquema relacional (ver Modelo de datos objetivo: épicas deduplicadas, `completed_at` derivado, markdown→bloques) y hace batch upsert con loader y notificación de éxito/fallo.
   - **Capa de datos (US 1.3):** CRUD vía Supabase con optimistic updates; si falla la red, revertir y mostrar error.
4. **Verificación.** Login real; migración completa de datos de prueba; RLS con dos usuarios; paridad de todos/editor intacta.
5. **Cierre.** Actualiza `Backend Supabase`, `App de escritorio`, ADR-008 (consecuencias reales) y MOC. Commits `feat(desktop)` / `feat(backend)` según el cambio.
