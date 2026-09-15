-- ============================================================================
-- Tests pgTAP de la racha global (ADR-012)
-- Agregación cross-épica, weekend freeze y zona horaria.
-- Los datos de seed se limpian dentro de la transacción (rollback al final).
-- Ejecutar: supabase test db
-- ============================================================================
begin;
select plan(9);

delete from public.todos;

-- ----------------------------------------------------------------------------
-- Datos de prueba: enero 2030 (13 = domingo, 14 = lunes, 15 = martes)
-- G1: viernes 11 y lunes 14; G2: martes 15; madrugada del 16 para zona horaria.
-- ----------------------------------------------------------------------------
insert into public.epics (id, user_id, name, color_code) values
  ('dd000000-0000-4000-8000-00000000000d', '11111111-1111-4111-8111-111111111111', 'Global 1', '#6750A4'),
  ('de000000-0000-4000-8000-00000000000e', '11111111-1111-4111-8111-111111111111', 'Global 2', '#1E88E5');

insert into public.projects (id, epic_id, user_id, name, color_code, status) values
  ('df000000-0000-4000-8000-00000000000f', 'dd000000-0000-4000-8000-00000000000d', '11111111-1111-4111-8111-111111111111', 'Proyecto G1', '#6750A4', 'active'),
  ('e0000000-0000-4000-8000-000000000000', 'de000000-0000-4000-8000-00000000000e', '11111111-1111-4111-8111-111111111111', 'Proyecto G2', '#1E88E5', 'active');

insert into public.todos (id, project_id, user_id, title, status, priority, urgency, completed_at) values
  ('e1000000-0000-4000-8000-000000000001', 'df000000-0000-4000-8000-00000000000f', '11111111-1111-4111-8111-111111111111', 'G1 viernes', 'done', 'medium', 'medium', '2030-01-11 12:00:00+00'),
  ('e1000000-0000-4000-8000-000000000002', 'df000000-0000-4000-8000-00000000000f', '11111111-1111-4111-8111-111111111111', 'G1 lunes', 'done', 'medium', 'medium', '2030-01-14 12:00:00+00'),
  ('e1000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000000', '11111111-1111-4111-8111-111111111111', 'G2 martes', 'done', 'medium', 'medium', '2030-01-15 12:00:00+00'),
  ('e1000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000000', '11111111-1111-4111-8111-111111111111', 'G2 madrugada', 'done', 'medium', 'medium', '2030-01-16 02:00:00+00');

-- 1-2: racha global cruzando épicas y fin de semana (vie + lun + mar)
select is(
  (select current_streak from public.streak_global('UTC', '2030-01-15')),
  3, 'Racha global = 3 (dos épicas, finde salteado)'
);
select is(
  (select best_streak from public.streak_global('UTC', '2030-01-15')),
  3, 'Mejor racha global = 3'
);

-- 3-4: corte por zona horaria (02:00 UTC del 16 = 23:00 del 15 en Buenos Aires)
select is(
  (select current_streak from public.streak_global('America/Argentina/Buenos_Aires', '2030-01-16')),
  3, 'En Buenos Aires la madrugada del 16 suma al 15'
);
select is(
  (select current_streak from public.streak_global('UTC', '2030-01-16')),
  4, 'En UTC la madrugada del 16 es un día propio'
);

-- 5: weekend freeze (domingo 13: sin actividad el finde, mantiene el viernes)
select is(
  (select current_streak from public.streak_global('UTC', '2030-01-13')),
  1, 'Weekend freeze: el domingo mantiene la racha del viernes'
);

-- 6-7: un día hábil pasado sin actividad corta la racha y conserva la mejor marca
select is(
  (select current_streak from public.streak_global('UTC', '2030-01-18')),
  0, 'El jueves sin actividad corta la racha actual'
);
select is(
  (select best_streak from public.streak_global('UTC', '2030-01-18')),
  4, 'La mejor marca global se conserva'
);

-- 8-9: sin actividad previa devuelve ceros
select is(
  (select current_streak from public.streak_global('UTC', '2030-01-01')),
  0, 'Sin actividad previa la racha actual es 0'
);
select is(
  (select best_streak from public.streak_global('UTC', '2030-01-01')),
  0, 'Sin actividad previa la mejor marca es 0'
);

select * from finish();
rollback;
