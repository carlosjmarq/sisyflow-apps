---
tags: [adr, decision, gamificacion, datos]
status: Propuesto
date: 2026-09-13
---

# ADR-011 Gamificación: zona horaria, rachas y heatmap

## Status

Aceptado — implementado y verificado en la Fase 5 (2026-09-13).

## Contexto

US 3.1–3.4 piden: vista de logs diarios (`daily_epic_logs`), heatmap de 365 días
global y por épica, racha actual + mejor marca por épica y "weekend freeze"
(sábados/domingos sin actividad no rompen la racha; completar en fin de semana
suma).

La vista `daily_epic_logs` existe desde la Fase 2, pero agrupa por día en **UTC**:
con una zona horaria local distinta, las tareas completadas de noche caen en el
día equivocado y las rachas se distorsionan. Quedan por decidir: el corte del
día, dónde se calculan las rachas y cómo se construye el heatmap.

## Decisión

1. **Zona horaria del corte**: el cliente envía su zona IANA
   (`Intl.DateTimeFormat().resolvedOptions().timeZone`) a funciones SQL que
   agrupan con `at time zone`. La vista `daily_epic_logs` (UTC) se conserva para
   consumidores SQL; la app usa la función `daily_epic_logs_tz(p_tz, p_days)`.
   Zona inválida → fallback `UTC`.
2. **Rachas en SQL**: función `epic_streaks(p_tz, p_today)` que devuelve
   `(epic_id, current_streak, best_streak)` calculadas sobre el historial:
   - Día activo (cantidad > 0) suma 1.
   - Hoy sin actividad no rompe (el día aún no cerró).
   - Sábado/domingo sin actividad no rompen (weekend freeze).
   - Un día hábil anterior sin actividad corta la cadena (la racha actual queda
     en 0 salvo que hoy tenga actividad).
   - `best_streak` es la corrida más larga del historial con las mismas reglas.
   El parámetro `p_today` existe para tests; en producción se usa la fecha local.
3. **Heatmap propio**: componente React sin dependencias (grilla de 53 semanas ×
   7 días) con intensidad en 4 niveles y color base según la épica. Descarta
   librerías de charts para mantener el bundle y el control visual.
4. **Pantalla Progreso** (`/progress`): heatmap con selector "Vista global" o
   por épica + tarjetas por épica con racha actual (🔥) y mejor marca. No se
   persiste ningún contador: todo se deriva de `completed_at`.

## Consecuencias

### Positivas

- Rachas correctas en la zona horaria del usuario, sin lógica de fechas en el
  cliente.
- Las reglas de US 3.3/3.4 quedan cubiertas por tests pgTAP deterministas
  (incluye `p_today` para simular días).
- Sin dependencias nuevas ni contadores que puedan desincronizarse.

### Negativas / Trade-offs

- Dos caminos de agregación (vista UTC y función con zona) que deben mantenerse
  coherentes.
- El heatmap es código propio a mantener (tooltips, meses, accesibilidad básica).

### Neutrales

- `daily_epic_logs` (UTC) queda como referencia para consultas SQL/Studio; la
  app siempre usa la variante con zona horaria.
- La mejor marca se recalcula en cada consulta (barato a esta escala).

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-007 Jerarquia Epicas Proyectos Tareas]], [[ADR-008 Estrategia de datos nube-first]], [[ADR-010 Ciclo de vida de proyectos y vista del dia]]
- **Afecta a:** [[Gamificacion]], [[Modelo de datos objetivo (Supabase)]], [[Backend Supabase]], [[Capa de datos Supabase]]
- **Repo:** `backend/supabase/migrations/`, `apps/desktop/src/`
