-- ============================================================================
-- SisyFlow — Días de la semana para la recurrencia personalizada (ADR-017)
-- `todos.recurrence_days` guarda los días ISO (1 = lunes … 7 = domingo) de una
-- tarea con `recurrence = 'custom'`. Para el resto de las recurrencias es null.
-- ============================================================================

alter table public.todos add column recurrence_days smallint[];

alter table public.todos
  add constraint todos_recurrence_days_valid check (
    recurrence_days is null
    or (
      cardinality(recurrence_days) between 1 and 7
      and recurrence_days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
    )
  ),
  add constraint todos_recurrence_custom_days check (
    recurrence <> 'custom' or coalesce(cardinality(recurrence_days), 0) >= 1
  );
