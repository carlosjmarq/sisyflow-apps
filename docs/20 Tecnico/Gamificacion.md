---
tags: [tecnico, gamificacion, streak, heatmap]
status: permanente
date: 2026-09-13
---

# Gamificación

## Contexto

La gamificación es el corazón motivacional de SisyFlow: visualizar el esfuerzo
diario para no romper la cadena (método Seinfeld). Cubre las US 3.1–3.4 del
backlog ([[US's for personal development project]]) y depende del modelo
[[Modelo de datos objetivo (Supabase)]] y de `completed_at` en `todos`.

## Contenido

### US 3.1 — Vista `daily_epic_logs`

- Vista SQL en Supabase: agrupa por día y épica la cantidad de tareas completadas
  (`completed_at` no nulo), uniendo `todos` → `projects`.
- Salida limpia: `[fecha, epic_id, cantidad_completada]`.
- Debe ser eficiente: índices en `completed_at` y `project_id`; `security_invoker = true`.
- La app usa la función `daily_epic_logs_tz(p_tz, p_days)` para cortar el día en
  la zona horaria del cliente; la vista UTC queda para consumidores SQL
  ([[ADR-011 Gamificacion zona horaria rachas y heatmap]]).

### US 3.2 — Heatmap (365 días)

- Gráfico estilo contribuciones de GitHub con los últimos 365 días.
- Selector "Vista Global" o por "Épica Específica".
- Intensidad del color según cantidad de tareas completadas del día.
- Con filtro por épica, los cuadros usan el `color_code` de esa épica
  (variaciones de intensidad sobre el color base).

### US 3.3 — Racha actual y mejor marca

- Por épica: racha actual (🔥 días consecutivos) y récord histórico (best streak).
- Reglas:
  - Suma +1 por cada día con cantidad completada > 0 en `daily_epic_logs`.
  - Si hoy no se completó nada pero ayer sí, la racha **se mantiene** (el día
    actual aún no cierra).
  - Si el día anterior cerró en 0, la racha cae a 0.

### US 3.4 — Weekend freeze

- Sábado y domingo con 0 completadas **no rompen** la racha: el contador
  conserva el valor del viernes.
- Completar una tarea en fin de semana suma +1 como recompensa.

### Implementación (Fase 5)

- Migración `gamification_rpc`: funciones `daily_epic_logs_tz` y `epic_streaks`
  (`security invoker`, ejecutables solo por `authenticated`).
- Rachas calculadas en SQL con las reglas de US 3.3/3.4; `p_today` permite tests
  deterministas con pgTAP (11 aserciones de gamificación, 38 en total).
- Pantalla **Progreso** (`/progress`): heatmap de 365 días con selector
  "Vista global" / por épica y tarjetas de racha (🔥 actual + mejor marca),
  ordenadas por racha actual.
- Heatmap propio (`Heatmap.tsx`), sin dependencias: 4 niveles de intensidad,
  color base de la épica, etiquetas de mes y tooltip por día.

### Decisiones tomadas

- [x] Zona horaria para el corte del día: la del cliente, vía RPC (ADR-011).
- [x] Cálculo en SQL (funciones), no en el cliente; testeable con pgTAP.
- [x] Best streak: se recalcula en cada consulta (no se persiste).
- [x] Heatmap: componente propio, sin librería de charts.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Modelo de datos objetivo (Supabase)]], [[Backend Supabase]]
- **ADR:** [[ADR-007 Jerarquia Epicas Proyectos Tareas]], [[ADR-008 Estrategia de datos nube-first]]
- **Ruta en el monorepo:** `backend/supabase/migrations/` (vista), `apps/desktop/src/` (UI)
