-- ============================================================================
-- SisyFlow — Gamificación: agregación por zona horaria y rachas (ADR-011)
-- US 3.1–3.4: logs diarios, rachas y weekend freeze calculados en SQL.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- US 3.1: logs diarios [día, epic_id, cantidad] con corte en la zona horaria
-- del cliente. La vista daily_epic_logs (UTC) se conserva para SQL directo.
-- ----------------------------------------------------------------------------
create or replace function public.daily_epic_logs_tz(
  p_tz text default 'UTC',
  p_days integer default 365
)
returns table (day date, epic_id uuid, completed_count integer)
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
    select (now() at time zone (select tz from zone))::date as today
  )
  select
    (t.completed_at at time zone (select tz from zone))::date as day,
    p.epic_id,
    count(*)::integer as completed_count
  from public.todos t
  join public.projects p on p.id = t.project_id
  where t.completed_at is not null
    and (t.completed_at at time zone (select tz from zone))::date
        >= (select today from anchor) - (greatest(p_days, 1) - 1)
  group by 1, 2
  order by 1 desc;
$$;

-- ----------------------------------------------------------------------------
-- US 3.3 + 3.4: racha actual y mejor marca por épica.
-- Reglas: día activo suma; hoy sin actividad no rompe; sábado/domingo sin
-- actividad no rompen (weekend freeze); un día hábil anterior en 0 corta.
-- `p_today` permite tests deterministas; en producción se usa la fecha local.
-- ----------------------------------------------------------------------------
create or replace function public.epic_streaks(
  p_tz text default 'UTC',
  p_today date default null
)
returns table (epic_id uuid, current_streak integer, best_streak integer)
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
    select
      (t.completed_at at time zone (select tz from zone))::date as day,
      p.epic_id
    from public.todos t
    join public.projects p on p.id = t.project_id
    where t.completed_at is not null
      and (t.completed_at at time zone (select tz from zone))::date
          <= (select today from anchor)
  ),
  days as (
    select generate_series(
      least(
        coalesce(min(day), (select today from anchor)),
        (select today from anchor)
      ),
      (select today from anchor),
      interval '1 day'
    )::date as day
    from logs
  ),
  activity as (
    select e.id as epic_id, d.day,
           exists (
             select 1 from logs l where l.epic_id = e.id and l.day = d.day
           ) as active
    from public.epics e
    cross join days d
  ),
  flagged as (
    select a.epic_id, a.day, a.active,
           case
             when a.active then 0
             when a.day = (select today from anchor) then 0
             when extract(isodow from a.day) in (6, 7) then 0
             else 1
           end as is_break
    from activity a
  ),
  grouped as (
    select f.epic_id, f.day, f.active,
           sum(f.is_break) over (
             partition by f.epic_id
             order by f.day
             rows between unbounded preceding and current row
           ) as grp
    from flagged f
  ),
  runs as (
    select g.epic_id, g.grp,
           count(*) filter (where g.active)::integer as streak_len,
           max(g.day) as last_day
    from grouped g
    group by g.epic_id, g.grp
  ),
  per_epic as (
    select r.epic_id,
           max(r.streak_len) filter (
             where r.last_day = (select today from anchor)
           ) as current_streak,
           max(r.streak_len) as best_streak
    from runs r
    group by r.epic_id
  )
  select e.id as epic_id,
         coalesce(pe.current_streak, 0) as current_streak,
         coalesce(pe.best_streak, 0) as best_streak
  from public.epics e
  left join per_epic pe on pe.epic_id = e.id
  order by e.name;
$$;

-- ----------------------------------------------------------------------------
-- Permisos: solo `authenticated` ejecuta las funciones (RLS vía security invoker)
-- ----------------------------------------------------------------------------
revoke execute on function public.daily_epic_logs_tz(text, integer) from public, anon;
revoke execute on function public.epic_streaks(text, date) from public, anon;

grant execute on function public.daily_epic_logs_tz(text, integer) to authenticated;
grant execute on function public.epic_streaks(text, date) to authenticated;
