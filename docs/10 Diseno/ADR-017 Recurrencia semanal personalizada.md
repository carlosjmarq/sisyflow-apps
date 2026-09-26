---
tags: [adr, decision, datos, recurrencia]
status: Aceptado
date: 2026-09-26
---

# ADR-017 Recurrencia semanal personalizada (días de la semana)

## Status

Aceptado — implementado el 2026-09-26 en backend, desktop, móvil y CLI. Extiende
[[ADR-014 Tareas recurrentes]].

## Contexto

[[ADR-014 Tareas recurrentes]] modeló la periodicidad con un enum fijo
(`none`, `daily`, `weekdays` = lunes a viernes, `weekly`, `monthly`). No permite
recurrencias como «cada lunes y martes». Se quiere un selector estilo Google
Calendar: elegir la frecuencia y, para la repetición semanal, marcar los días de
la semana.

Además, la vista «Tareas del día» mostraba **todas** las tareas recurrentes
todos los días, sin importar su periodicidad (una tarea de «días hábiles»
aparecía sábado y domingo).

## Decisión

1. **Modelo**: se agrega el valor `custom` al enum `todo_recurrence` y una
   columna `todos.recurrence_days smallint[]` con los días ISO (1 = lunes …
   7 = domingo). `custom` exige al menos un día; el resto de las recurrencias
   dejan `recurrence_days` en `null`. Constraints:
   `cardinality between 1 and 7`, `recurrence_days <@ '{1..7}'` y `custom` ⇒ no
   vacío. El valor del enum se agrega en una migración aparte porque Postgres no
   permite usar un valor nuevo en la misma transacción que lo crea.
2. **Selector estilo Google Calendar**: las opciones son Nunca, Diaria, Semanal,
   Días hábiles (Lun–Vie) y Mensual. «Semanal» se guarda como `custom` con los
   días marcados (por defecto, el día de creación de la tarea); «Días hábiles»
   usa el preset `weekdays`. `weekly` queda como valor legacy (no se ofrece).
3. **Filtrado por día en «Tareas del día»**: `custom` solo aparece en sus días y
   `weekdays` solo de lunes a viernes. `daily`, `weekly`, `monthly` y `none` no
   filtran. El filtro se hace en el cliente (la recurrencia sigue siendo
   desconocida para SQL, como en ADR-014).
4. **Período**: `custom` usa período de un día (etiqueta «hoy» y contador del
   día), igual que `weekdays`. Los demás períodos no cambian.
5. **CLI**: `--recurrence custom --days lun,mar` (acepta nombres o números 1..7;
   obligatorio con `custom`). `list`/`get` muestran los días. El `import` acepta
   `recurrence` y `recurrence_days`.

## Consecuencias

### Positivas

- Recurrencias semanales arbitrarias («lunes y martes») sin crear tareas nuevas.
- «Tareas del día» refleja la periodicidad real: menos ruido los días que no toca.
- Modelo extendible: `recurrence_days` sirve para futuras frecuencias.

### Negativas / Trade-offs

- `weekly` legacy convive sin migración masiva: se sigue mostrando todos los días
  con etiqueta «esta semana» y se normaliza a `custom` al editarla.
- El filtrado por día es de cliente; cualquier consumidor SQL (CLI, reportes) debe
  replicar la regla si la necesita.
- `weekdays` ahora deja de aparecer los fines de semana en «Tareas del día»
  (cambio de comportamiento respecto de ADR-014).

### Neutrales

- La gamificación no cambia: sigue contando marcas de tiempo de
  `todos.completed_at` y `todo_completions`.
- El backup (v4) exporta filas crudas, así que `recurrence_days` viaja solo.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Extiende a:** [[ADR-014 Tareas recurrentes]]
- **Relacionada con:** [[ADR-007 Jerarquia Epicas Proyectos Tareas]], [[ADR-010 Ciclo de vida de proyectos y vista del dia]], [[ADR-011 Gamificacion zona horaria rachas y heatmap]]
- **Afecta a:** [[Modelo de datos objetivo (Supabase)]], [[Capa de datos Supabase]], [[App de escritorio (base TodoDex)]], [[App móvil (Flutter)]], [[CLI de SisyFlow]]
- **Repo:** `backend/supabase/migrations/`, `apps/desktop/src/`, `apps/mobile/lib/`, `apps/cli/src/`
