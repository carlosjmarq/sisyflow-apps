-- ============================================================================
-- SisyFlow — Realtime (Postgres Changes)
-- Habilita la replicación de las tablas del dominio en la publicación
-- `supabase_realtime` para que el desktop y el móvil reciban los cambios por
-- WebSocket (ADR-016). `replica identity full` es necesario para recibir y
-- filtrar el `old_record` en UPDATE/DELETE: la RLS no se aplica a DELETE, así
-- que los clientes SIEMPRE filtran por `user_id` para no recibir borrados
-- ajenos.
-- ============================================================================

alter publication supabase_realtime add table
  public.epics,
  public.projects,
  public.todos,
  public.tags,
  public.todo_completions;

alter table public.epics            replica identity full;
alter table public.projects         replica identity full;
alter table public.todos            replica identity full;
alter table public.tags             replica identity full;
alter table public.todo_completions replica identity full;
