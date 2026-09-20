---
tags: [adr, decision, datos, recurrencia]
status: Aceptado
date: 2026-09-20
---

# ADR-014 Tareas recurrentes: periodicidad y registro de completados

## Status

Aceptado — implementado y verificado el 2026-09-20 (US 4.1).

## Contexto

US 4.1 pide definir una periodicidad para una tarea y completarla muchas veces
sin crear una tarea nueva cada vez (ej. ver una clase del curso todos los días).
El modelo actual tiene un solo `completed_at` por tarea y el estado `done` es
terminal: una tarea completada no puede volver a completarse sin reabrirla, y el
historial de repeticiones se perdería.

Alternativas consideradas:

1. **Materializar una tarea hija por período** (generar la tarea de hoy al
   cerrar el período). Multiplica filas, requiere un generador y complica el
   "hecho hoy" cuando el usuario abre la app a destiempo.
2. **Unificar el historial de todas las tareas en una tabla de completados**
   (también las de una sola vez). Es más limpio a largo plazo, pero reescribe el
   trigger de `completed_at`, la migración Sísifo, el backup y toda la
   gamificación existente; riesgo alto para el beneficio actual.
3. **Configurar la recurrencia en `todos` + registrar cada completado en una
   tabla nueva** (elegida). Las tareas de una sola vez no cambian en absoluto.

## Decisión

1. **Recurrencia en la tarea**: columna `todos.recurrence` con enum
   `todo_recurrence` (`none`, `daily`, `weekdays`, `weekly`, `monthly`);
   `none` por defecto. `weekdays` = lunes a viernes.
2. **Historial de empujes**: tabla `todo_completions(id, todo_id, user_id,
   completed_at, created_at)`. Cada clic en una tarea recurrente inserta una
   fila; la tarea **nunca** pasa a `done` ni escribe `completed_at` en `todos`.
   La FK `todo_id` es `on delete cascade`.
3. **Múltiples completados por período**: cada completado cuenta para el
   heatmap (intensidad por cantidad) y la racha sigue siendo binaria por día
   (hubo actividad o no), con las reglas de [[ADR-011 Gamificacion zona horaria rachas y heatmap]].
4. **Períodos de calendario en hora local**: el cliente calcula el inicio del
   período vigente (día a las 00:00, semana el lunes, mes el día 1) para mostrar
   el estado "hecho" y el contador. SQL no conoce períodos: agrega marcas de
   tiempo crudas por día local, como hoy.
5. **Gamificación sin duplicar caminos**: la vista `daily_epic_logs` y las
   funciones `daily_epic_logs_tz`, `epic_streaks` y `streak_global` pasan a
   contar la unión de `todos.completed_at` (tareas de una vez) y
   `todo_completions.completed_at` (recurrentes), conservando firmas,
   `security invoker` y permisos.
6. **Integridad**: un trigger en `todo_completions` rechaza completados cuyo
   `todo_id` no pertenezca al mismo usuario o cuya tarea no sea recurrente.
7. **RLS** `auth.uid() = user_id` en la tabla nueva, con índices
   `(todo_id, completed_at desc)`, `(user_id)` y `(completed_at)`.
8. **Al activar recurrencia sobre una tarea ya completada**, su `completed_at`
   se convierte en el primer completado del historial y la tarea vuelve a
   `todo`: no se pierde el empuje ni la racha.

## Consecuencias

### Positivas

- Una sola tarea por hábito; el historial de repeticiones queda fechado y
  disponible para heatmap, rachas y consultas.
- Las tareas de una sola vez no cambian: paridad intacta y migración Sísifo sin
  tocar.
- La gamificación existente se reutiliza: solo cambia la fuente de las marcas de
  tiempo (unión), no las reglas de rachas ni de weekend freeze.

### Negativas / Trade-offs

- Conviven dos fuentes de "completado" (`todos.completed_at` y
  `todo_completions.completed_at`): toda consulta de gamificación debe unirlas.
- Borrar una tarea recurrente borra su historial (mismo comportamiento actual al
  borrar una tarea completada).
- El estado "hecho" de una recurrente se calcula en el cliente (períodos de
  calendario locales); SQL no lo valida.

### Neutrales

- `daily_epic_logs` (UTC) también cuenta la unión, para consumidores SQL.
- El backup sube a v4 (incluye `todo_completions`); el import sigue aceptando
  v2 y v3, que se interpretan como tareas sin recurrencia y sin historial.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-007 Jerarquia Epicas Proyectos Tareas]], [[ADR-008 Estrategia de datos nube-first]], [[ADR-010 Ciclo de vida de proyectos y vista del dia]], [[ADR-011 Gamificacion zona horaria rachas y heatmap]]
- **Afecta a:** [[Modelo de datos objetivo (Supabase)]], [[Gamificacion]], [[Capa de datos Supabase]], [[CLI de SisyFlow]], [[Paridad funcional con TodoDex]]
- **Repo:** `backend/supabase/migrations/`, `apps/desktop/src/`, `apps/cli/src/`
