-- ============================================================================
-- Tests pgTAP de RLS para SisyFlow
-- Verifican que cada usuario solo accede a sus filas (US 1.1) usando el seed.
-- Ejecutar: supabase test db
-- ============================================================================
begin;
select plan(22);

-- ----------------------------------------------------------------------------
-- Estructura: RLS activa y 4 politicas por tabla
-- ----------------------------------------------------------------------------

-- 1-4
select ok(relrowsecurity, 'RLS activa en epics') from pg_class where oid = 'public.epics'::regclass;
select ok(relrowsecurity, 'RLS activa en projects') from pg_class where oid = 'public.projects'::regclass;
select ok(relrowsecurity, 'RLS activa en todos') from pg_class where oid = 'public.todos'::regclass;
select ok(relrowsecurity, 'RLS activa en tags') from pg_class where oid = 'public.tags'::regclass;

-- 5-8
select is((select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'epics'), 4, 'epics: 4 politicas');
select is((select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'projects'), 4, 'projects: 4 politicas');
select is((select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'todos'), 4, 'todos: 4 politicas');
select is((select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'tags'), 4, 'tags: 4 politicas');

-- ----------------------------------------------------------------------------
-- Ana (1111...) solo ve sus datos
-- ----------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;

-- 9-13
select is((select count(*)::int from public.epics), 2, 'Ana ve solo sus 2 epicas');
select is((select count(*)::int from public.projects), 2, 'Ana ve solo sus 2 proyectos');
select is((select count(*)::int from public.todos), 6, 'Ana ve solo sus 6 tareas');
select is((select count(*)::int from public.tags), 2, 'Ana ve solo sus 2 tags');
select is((select count(*)::int from public.epics where id = 'a2000000-0000-4000-8000-000000000001'), 0, 'Ana no ve la epica de Beto');

-- 14: update sobre fila ajena no afecta ninguna fila
with u as (
  update public.todos set title = 'hack' where id = 'c2000000-0000-4000-8000-000000000001' returning 1
)
select is((select count(*)::int from u), 0, 'Ana no puede actualizar tareas de Beto');

-- 15: delete sobre fila ajena no afecta ninguna fila
with d as (
  delete from public.todos where id = 'c2000000-0000-4000-8000-000000000001' returning 1
)
select is((select count(*)::int from d), 0, 'Ana no puede borrar tareas de Beto');

-- 16: insert con user_id ajeno viola RLS
select throws_ok(
  $sql$ insert into public.todos (project_id, user_id, title)
        values ('b2000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'intruso') $sql$,
  '42501', null, 'Ana no puede insertar tareas a nombre de Beto'
);

-- 17: insert propio funciona
select lives_ok(
  $sql$ insert into public.todos (project_id, user_id, title)
        values ('b1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Nueva tarea de Ana') $sql$,
  'Ana puede insertar sus propias tareas'
);

-- 18-19: la vista de gamificacion respeta RLS
select is((select count(*)::int from public.daily_epic_logs), 3, 'Ana ve 3 filas en daily_epic_logs');
select is((select count(*)::int from public.daily_epic_logs where epic_id = 'a2000000-0000-4000-8000-000000000001'), 0, 'Ana no ve gamificacion de Beto');

-- ----------------------------------------------------------------------------
-- Beto (2222...) solo ve sus datos
-- ----------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;

-- 20-21
select is((select count(*)::int from public.epics), 1, 'Beto ve solo su epica');
select is((select count(*)::int from public.todos), 3, 'Beto ve solo sus 3 tareas');

-- ----------------------------------------------------------------------------
-- anon no tiene acceso a las tablas
-- ----------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;

-- 22
select throws_ok(
  $sql$ select count(*) from public.todos $sql$,
  '42501', null, 'anon no tiene acceso a las tablas'
);

select * from finish();
rollback;
