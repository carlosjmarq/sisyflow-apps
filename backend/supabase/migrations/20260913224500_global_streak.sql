-- ============================================================================
-- SisyFlow — Racha global para el hero de Inicio (ADR-012)
-- Extiende la gamificación (ADR-011) con la racha agregada de todas las épicas.
-- Reglas idénticas a epic_streaks: weekend freeze, hoy sin actividad no rompe.
-- ============================================================================
create or replace function public.streak_global(
  p_tz text default 'UTC',
  p_today date default null
)
returns table (current_streak integer, best_streak integer)
language sql
stable
set search_path = ''
as $$
  with zone as (
    select case
      when exists (select 1 from pg_catalog.pg_timezone_names z where z.name = p_tz)
        then p_tz
      else 'UTC'
    end as tz
  ),
  anchor as (
    select coalesce(p_today, (now() at time zone (select tz from zone))::date) as today
  ),
  logs as (
    select distinct (t.completed_at at time zone (select tz from zone))::date as day
    from public.todos t
    where t.completed_at is not null
      and (t.completed_at at time zone (select tz from zone))::date
          <= (select today from anchor)
  ),
  days as (
    select generate_series(
      least(
        coalesce((select min(day) from logs), (select today from anchor)),
        (select today from anchor)
      ),
      (select today from anchor),
      interval '1 day'
    )::date as day
  ),
  flagged as (
    select d.day,
           exists (select 1 from logs l where l.day = d.day) as active
    from days d
  ),
  marked as (
    select f.day, f.active,
           case
             when f.active then 0
             when f.day = (select today from anchor) then 0
             when extract(isodow from f.day) in (6, 7) then 0
             else 1
           end as is_break
    from flagged f
  ),
  grouped as (
    select m.day, m.active,
           sum(m.is_break) over (
             order by m.day
             rows between unbounded preceding and current row
           ) as grp
    from marked m
  ),
  runs as (
    select g.grp,
           count(*) filter (where g.active)::integer as streak_len,
           max(g.day) as last_day
    from grouped g
    group by g.grp
  )
  select
    coalesce(max(r.streak_len) filter (where r.last_day = (select today from anchor)), 0) as current_streak,
    coalesce(max(r.streak_len), 0) as best_streak
  from runs r;
$$;

revoke execute on function public.streak_global(text, date) from public, anon;
grant execute on function public.streak_global(text, date) to authenticated;
