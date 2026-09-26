-- ============================================================================
-- SisyFlow — Recurrencia semanal personalizada (ADR-017)
-- Agrega el valor `custom` al enum `todo_recurrence`. Va en su propia migración
-- porque Postgres no permite usar un valor de enum nuevo en la misma
-- transacción que lo crea.
-- ============================================================================

alter type public.todo_recurrence add value if not exists 'custom';
