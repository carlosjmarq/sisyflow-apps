-- ============================================================================
-- Tests pgTAP de recurrencia personalizada (ADR-017)
-- `todos.recurrence_days` (ISO 1..7): obligatorio y no vacío para `custom`,
-- dentro de rango y máximo 7 días.
-- Ejecutar: supabase test db
-- ============================================================================
begin;
select plan(4);

-- Datos mínimos: reutiliza el usuario y proyecto del seed.
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

-- 1: `custom` sin días falla
select throws_ok(
  $sql$ insert into public.todos (project_id, user_id, title, recurrence)
        values ('b1000000-0000-4000-8000-000000000001',
                '11111111-1111-4111-8111-111111111111',
                'Custom sin días', 'custom') $sql$,
  '23514', null, 'custom sin recurrence_days es rechazado'
);

-- 2: un día fuera de rango (8) falla
select throws_ok(
  $sql$ insert into public.todos (project_id, user_id, title, recurrence, recurrence_days)
        values ('b1000000-0000-4000-8000-000000000001',
                '11111111-1111-4111-8111-111111111111',
                'Custom día 8', 'custom', array[8]::smallint[]) $sql$,
  '23514', null, 'un día fuera de 1..7 es rechazado'
);

-- 3: un array vacío falla (no alcanza con no ser null)
select throws_ok(
  $sql$ insert into public.todos (project_id, user_id, title, recurrence, recurrence_days)
        values ('b1000000-0000-4000-8000-000000000001',
                '11111111-1111-4111-8111-111111111111',
                'Custom sin días reales', 'custom', array[]::smallint[]) $sql$,
  '23514', null, 'recurrence_days vacío es rechazado'
);

-- 4: lunes y martes es válido
select lives_ok(
  $sql$ insert into public.todos (project_id, user_id, title, recurrence, recurrence_days)
        values ('b1000000-0000-4000-8000-000000000001',
                '11111111-1111-4111-8111-111111111111',
                'Custom lunes y martes', 'custom', array[1, 2]::smallint[]) $sql$,
  'custom con lunes y martes es válido'
);

select * from finish();
rollback;
