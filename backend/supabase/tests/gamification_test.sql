-- ============================================================================
-- Tests pgTAP de gamificación (Fase 5, ADR-011)
-- Rachas (US 3.3), weekend freeze (US 3.4), agregación y zona horaria (US 3.1).
-- Ejecutar: supabase test db
-- ============================================================================
begin;
select plan(11);

-- ----------------------------------------------------------------------------
-- Datos de prueba: enero 2030 (15 = martes, 14 = lunes, 11 = viernes, 13 = domingo)
-- ----------------------------------------------------------------------------
insert into public.epics (id, user_id, name, color_code) values
  ('aa000000-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', 'Racha A', '#22C55E'),
  ('ba000000-0000-4000-8000-00000000000b', '11111111-1111-4111-8111-111111111111', 'Racha B', '#3B82F6'),
  ('ca000000-0000-4000-8000-00000000000c', '11111111-1111-4111-8111-111111111111', 'Racha TZ', '#A855F7');

insert into public.projects (id, epic_id, user_id, name, color_code, status) values
  ('ab000000-0000-4000-8000-00000000000a', 'aa000000-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', 'Proyecto A', '#C7F9CC', 'active'),
  ('bb000000-0000-4000-8000-00000000000b', 'ba000000-0000-4000-8000-00000000000b', '11111111-1111-4111-8111-111111111111', 'Proyecto B', '#C7F9CC', 'active'),
  ('cb000000-0000-4000-8000-00000000000c', 'ca000000-0000-4000-8000-00000000000c', '11111111-1111-4111-8111-111111111111', 'Proyecto TZ', '#C7F9CC', 'active');

insert into public.todos (id, project_id, user_id, title, status, priority, urgency, completed_at) values
  ('ac000000-0000-4000-8000-000000000001', 'ab000000-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', 'A martes 1', 'done', 'medium', 'medium', '2030-01-15 12:00:00+00'),
  ('ac000000-0000-4000-8000-000000000002', 'ab000000-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', 'A martes 2', 'done', 'medium', 'medium', '2030-01-15 18:00:00+00'),
  ('ac000000-0000-4000-8000-000000000003', 'ab000000-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', 'A lunes', 'done', 'medium', 'medium', '2030-01-14 12:00:00+00'),
  ('ac000000-0000-4000-8000-000000000004', 'ab000000-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', 'A viernes', 'done', 'medium', 'medium', '2030-01-11 12:00:00+00'),
  ('bc000000-0000-4000-8000-000000000001', 'bb000000-0000-4000-8000-00000000000b', '11111111-1111-4111-8111-111111111111', 'B lunes', 'done', 'medium', 'medium', '2030-01-14 12:00:00+00'),
  ('cc000000-0000-4000-8000-000000000001', 'cb000000-0000-4000-8000-00000000000c', '11111111-1111-4111-8111-111111111111', 'Z madrugada', 'done', 'medium', 'medium', '2030-01-15 02:00:00+00');

-- 1-2: racha mantenida cruzando el fin de semana (vie 11, lun 14, mar 15)
select is(
  (select current_streak from public.epic_streaks('UTC', '2030-01-15')
   where epic_id = 'aa000000-0000-4000-8000-00000000000a'),
  3, 'Racha actual = 3 (vie + lun + mar, finde salteado)'
);
select is(
  (select best_streak from public.epic_streaks('UTC', '2030-01-15')
   where epic_id = 'aa000000-0000-4000-8000-00000000000a'),
  3, 'Mejor racha = 3'
);

-- 3-4: weekend freeze (domingo 13: sin actividad el finde, mantiene el viernes)
select is(
  (select current_streak from public.epic_streaks('UTC', '2030-01-13')
   where epic_id = 'aa000000-0000-4000-8000-00000000000a'),
  1, 'Weekend freeze: el domingo mantiene la racha del viernes'
);
select is(
  (select best_streak from public.epic_streaks('UTC', '2030-01-13')
   where epic_id = 'aa000000-0000-4000-8000-00000000000a'),
  1, 'Mejor racha al domingo = 1 (solo viernes en el rango)'
);

-- 5: si hoy no hay nada y ayer sí, la racha se mantiene
select is(
  (select current_streak from public.epic_streaks('UTC', '2030-01-15')
   where epic_id = 'ba000000-0000-4000-8000-00000000000b'),
  1, 'Hoy pendiente: la racha de ayer se mantiene'
);

-- 6-7: si ayer cerró en 0, la racha cae y la mejor marca queda
select is(
  (select current_streak from public.epic_streaks('UTC', '2030-01-16')
   where epic_id = 'ba000000-0000-4000-8000-00000000000b'),
  0, 'Un día hábil en 0 corta la racha actual'
);
select is(
  (select best_streak from public.epic_streaks('UTC', '2030-01-16')
   where epic_id = 'ba000000-0000-4000-8000-00000000000b'),
  1, 'La mejor marca histórica se conserva'
);

-- 8: agregación por día (dos tareas el mismo día suman)
select is(
  (select completed_count from public.daily_epic_logs_tz('UTC', 10000)
   where epic_id = 'aa000000-0000-4000-8000-00000000000a' and day = '2030-01-15'),
  2, 'Dos tareas del mismo día suman 2'
);

-- 9-10: corte por zona horaria (02:00 UTC = 23:00 del día anterior en Buenos Aires)
select is(
  (select completed_count from public.daily_epic_logs_tz('America/Argentina/Buenos_Aires', 10000)
   where epic_id = 'ca000000-0000-4000-8000-00000000000c' and day = '2030-01-14'),
  1, 'En Buenos Aires la madrugada cuenta en el día anterior'
);
select is(
  (select count(*)::int from public.daily_epic_logs_tz('America/Argentina/Buenos_Aires', 10000)
   where epic_id = 'ca000000-0000-4000-8000-00000000000c'),
  1, 'No queda fila en el día UTC original'
);

-- 11: zona inválida cae a UTC
select is(
  (select completed_count from public.daily_epic_logs_tz('No/Existe', 10000)
   where epic_id = 'ca000000-0000-4000-8000-00000000000c' and day = '2030-01-15'),
  1, 'Zona horaria inválida usa UTC'
);

select * from finish();
rollback;
