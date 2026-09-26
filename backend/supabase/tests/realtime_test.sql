-- ============================================================================
-- Tests pgTAP de Realtime (ADR-016)
-- Verifica que las tablas del dominio estén en la publicación
-- `supabase_realtime` y con `replica identity full` (necesario para filtrar
-- UPDATE/DELETE por `user_id`).
-- Ejecutar: supabase test db
-- ============================================================================
begin;
select plan(10);

-- ----------------------------------------------------------------------------
-- Publicación
-- ----------------------------------------------------------------------------
select ok(
  exists (select 1 from pg_publication_tables
          where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'epics'),
  'epics publicada en supabase_realtime'
);
select ok(
  exists (select 1 from pg_publication_tables
          where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'projects'),
  'projects publicada en supabase_realtime'
);
select ok(
  exists (select 1 from pg_publication_tables
          where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'todos'),
  'todos publicada en supabase_realtime'
);
select ok(
  exists (select 1 from pg_publication_tables
          where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tags'),
  'tags publicada en supabase_realtime'
);
select ok(
  exists (select 1 from pg_publication_tables
          where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'todo_completions'),
  'todo_completions publicada en supabase_realtime'
);

-- ----------------------------------------------------------------------------
-- Replica identity full (relreplident = 'f')
-- ----------------------------------------------------------------------------
select ok(
  (select c.relreplident = 'f'
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'epics'),
  'epics con replica identity full'
);
select ok(
  (select c.relreplident = 'f'
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'projects'),
  'projects con replica identity full'
);
select ok(
  (select c.relreplident = 'f'
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'todos'),
  'todos con replica identity full'
);
select ok(
  (select c.relreplident = 'f'
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'tags'),
  'tags con replica identity full'
);
select ok(
  (select c.relreplident = 'f'
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'todo_completions'),
  'todo_completions con replica identity full'
);

select * from finish();
rollback;
