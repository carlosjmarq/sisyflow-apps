-- ============================================================================
-- Tests pgTAP de tareas recurrentes (US 4.1, ADR-014)
-- RLS, trigger de integridad, cascada y unión con la gamificación (ADR-011).
-- Ejecutar: supabase test db
-- ============================================================================
begin;
select plan(12);

-- Los datos de seed se limpian dentro de la transacción (rollback al final),
-- igual que global_streak_test.sql, para aislar las rachas.
delete from public.todos;

-- ----------------------------------------------------------------------------
-- Datos de prueba: enero 2030 (14 = lunes, 15 = martes)
-- Ana: tarea recurrente diaria con 4 completados (dos el martes) y una tarea
-- normal. Beto: tarea recurrente con un completado (para RLS).
-- ----------------------------------------------------------------------------
insert into public.epics (id, user_id, name, color_code) values
  ('fa000000-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', 'Recurrente Ana', '#22C55E'),
  ('fa200000-0000-4000-8000-00000000000a', '22222222-2222-4222-8222-222222222222', 'Recurrente Beto', '#3B82F6');

insert into public.projects (id, epic_id, user_id, name, color_code, status) values
  ('fb000000-0000-4000-8000-00000000000b', 'fa000000-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', 'Curso Ana', '#22C55E', 'active'),
  ('fb200000-0000-4000-8000-00000000000b', 'fa200000-0000-4000-8000-00000000000a', '22222222-2222-4222-8222-222222222222', 'Curso Beto', '#3B82F6', 'active');

insert into public.todos (id, project_id, user_id, title, status, priority, urgency, recurrence) values
  ('fc000000-0000-4000-8000-000000000001', 'fb000000-0000-4000-8000-00000000000b', '11111111-1111-4111-8111-111111111111', 'Ver clase (diaria)', 'in-progress', 'high', 'medium', 'daily'),
  ('fc000000-0000-4000-8000-000000000002', 'fb000000-0000-4000-8000-00000000000b', '11111111-1111-4111-8111-111111111111', 'Tarea normal', 'todo', 'medium', 'medium', 'none'),
  ('fc200000-0000-4000-8000-000000000001', 'fb200000-0000-4000-8000-00000000000b', '22222222-2222-4222-8222-222222222222', 'Ver clase de Beto', 'todo', 'medium', 'medium', 'daily');

insert into public.todo_completions (id, todo_id, user_id, completed_at) values
  ('fd000000-0000-4000-8000-000000000001', 'fc000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '2030-01-14 12:00:00+00'),
  ('fd000000-0000-4000-8000-000000000002', 'fc000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '2030-01-15 12:00:00+00'),
  ('fd000000-0000-4000-8000-000000000003', 'fc000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '2030-01-15 18:00:00+00'),
  ('fd000000-0000-4000-8000-000000000004', 'fc000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '2030-01-16 02:00:00+00'),
  ('fd200000-0000-4000-8000-000000000001', 'fc200000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', '2030-01-15 12:00:00+00');

-- ----------------------------------------------------------------------------
-- Ana: completados propios (RLS + trigger de integridad)
-- ----------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;

-- 1: un completado válido se inserta
select lives_ok(
  $sql$ insert into public.todo_completions (todo_id, user_id, completed_at)
        values ('fc000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '2030-01-17 12:00:00+00') $sql$,
  'Ana completa su tarea recurrente'
);

-- 2: una tarea sin recurrencia no admite completados
select throws_ok(
  $sql$ insert into public.todo_completions (todo_id, user_id)
        values ('fc000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111') $sql$,
  'P0001', null, 'Una tarea sin recurrencia no admite completados'
);

-- 3: no se puede completar una tarea recurrente ajena
select throws_ok(
  $sql$ insert into public.todo_completions (todo_id, user_id)
        values ('fc200000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111') $sql$,
  'P0001', null, 'Ana no puede completar la tarea recurrente de Beto'
);

-- 4: Ana no ve los completados de Beto
select is(
  (select count(*)::int from public.todo_completions
   where todo_id = 'fc200000-0000-4000-8000-000000000001'),
  0, 'Ana no ve los completados de Beto'
);

-- 5: Ana no puede borrar los completados de Beto (RLS: 0 filas)
with d as (
  delete from public.todo_completions
  where id = 'fd200000-0000-4000-8000-000000000001' returning 1
)
select is((select count(*)::int from d), 0, 'Ana no puede borrar los completados de Beto');

-- ----------------------------------------------------------------------------
-- Gamificación: la unión cuenta los completados (ADR-011)
-- ----------------------------------------------------------------------------
reset role;

-- 6: la vista UTC agrupa los dos completados del martes
select is(
  (select completed_count from public.daily_epic_logs
   where epic_id = 'fa000000-0000-4000-8000-00000000000a' and day = '2030-01-15'),
  2, 'La vista daily_epic_logs cuenta los completados recurrentes'
);

-- 7: la función con zona horaria también
select is(
  (select completed_count from public.daily_epic_logs_tz('UTC', 10000)
   where epic_id = 'fa000000-0000-4000-8000-00000000000a' and day = '2030-01-15'),
  2, 'daily_epic_logs_tz cuenta los completados recurrentes'
);

-- 8-9: la racha por épica incluye los días con completados
select is(
  (select current_streak from public.epic_streaks('UTC', '2030-01-16')
   where epic_id = 'fa000000-0000-4000-8000-00000000000a'),
  3, 'Racha por épica = 3 (lun, mar y madrugada del miércoles en UTC)'
);
select is(
  (select current_streak from public.epic_streaks('America/Argentina/Buenos_Aires', '2030-01-16')
   where epic_id = 'fa000000-0000-4000-8000-00000000000a'),
  2, 'En Buenos Aires la madrugada del miércoles cuenta al martes'
);

-- 10-11: la racha global también
select is(
  (select current_streak from public.streak_global('UTC', '2030-01-16')),
  3, 'Racha global = 3 con completados recurrentes'
);
select is(
  (select current_streak from public.streak_global('America/Argentina/Buenos_Aires', '2030-01-16')),
  2, 'Racha global con corte de zona horaria = 2'
);

-- ----------------------------------------------------------------------------
-- Cascada: borrar la tarea recurrente borra su historial
-- ----------------------------------------------------------------------------
-- 12
delete from public.todos where id = 'fc000000-0000-4000-8000-000000000001';
select is(
  (select count(*)::int from public.todo_completions
   where todo_id = 'fc000000-0000-4000-8000-000000000001'),
  0, 'Borrar la tarea recurrente borra sus completados'
);

select * from finish();
rollback;
