-- ============================================================================
-- Tests pgTAP de jerarquía y ciclo de vida de proyectos (Fase 4, ADR-010)
-- Ejecutar: supabase test db
-- ============================================================================
begin;
select plan(5);

-- 1: no se puede borrar una épica con proyectos (FK restrict)
select throws_ok(
  $sql$ delete from public.epics where id = 'a1000000-0000-4000-8000-000000000001' $sql$,
  '23503', null, 'No se puede borrar una épica con proyectos'
);

-- 2-3: transiciones válidas de estado del proyecto
select lives_ok(
  $sql$ update public.projects set status = 'paused'
        where id = 'b1000000-0000-4000-8000-000000000001' $sql$,
  'Un proyecto puede pasar a paused'
);
select lives_ok(
  $sql$ update public.projects set status = 'completed'
        where id = 'b1000000-0000-4000-8000-000000000001' $sql$,
  'Un proyecto puede pasar a completed'
);

-- 4: un estado inválido es rechazado por el enum
select throws_ok(
  $sql$ update public.projects set status = 'archived'
        where id = 'b1000000-0000-4000-8000-000000000001' $sql$,
  '22P02', null, 'Un estado de proyecto inválido es rechazado'
);

-- 5: una épica sin proyectos sí se puede borrar
insert into public.epics (id, user_id, name, color_code)
values (
  'af000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'Efimera',
  '#C7F9CC'
);
select lives_ok(
  $sql$ delete from public.epics where id = 'af000000-0000-4000-8000-000000000001' $sql$,
  'Una épica sin proyectos se puede borrar'
);

select * from finish();
rollback;
