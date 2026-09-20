-- ============================================================================
-- SisyFlow — Tareas recurrentes (US 4.1, ADR-014)
-- `todos.recurrence` define la periodicidad; `todo_completions` guarda cada
-- empuje de una tarea recurrente. La gamificación (ADR-011) pasa a contar la
-- unión de `todos.completed_at` (tareas de una vez) y `todo_completions`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Recurrencia de una tarea: none | daily | weekdays (L-V) | weekly | monthly
-- ----------------------------------------------------------------------------
create type public.todo_recurrence as enum ('none', 'daily', 'weekdays', 'weekly', 'monthly');

alter table public.todos
  add column recurrence public.todo_recurrence not null default 'none';

-- ----------------------------------------------------------------------------
-- Historial de completados de tareas recurrentes
-- ----------------------------------------------------------------------------
create table public.todo_completions (
  id uuid primary key default gen_random_uuid(),
  todo_id uuid not null references public.todos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index todo_completions_todo_id_idx on public.todo_completions (todo_id, completed_at desc);
create index todo_completions_user_id_idx on public.todo_completions (user_id);
create index todo_completions_completed_at_idx on public.todo_completions (completed_at);

-- ----------------------------------------------------------------------------
-- Integridad: solo se completa una tarea recurrente propia (ADR-014).
-- La función es security invoker: el SELECT respeta la RLS de `todos`, así que
-- un `todo_id` ajeno no se encuentra y el insert falla.
-- ----------------------------------------------------------------------------
create or replace function public.validate_todo_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.todos t
    where t.id = new.todo_id
      and t.user_id = new.user_id
      and t.recurrence <> 'none'
  ) then
    raise exception 'El completado requiere una tarea recurrente del mismo usuario';
  end if;
  return new;
end;
$$;

create trigger todo_completions_validate
  before insert or update on public.todo_completions
  for each row execute function public.validate_todo_completion();

-- ----------------------------------------------------------------------------
-- RLS y permisos (mismo patrón que el resto del esquema)
-- ----------------------------------------------------------------------------
alter table public.todo_completions enable row level security;

create policy "todo_completions_select_own" on public.todo_completions
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "todo_completions_insert_own" on public.todo_completions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "todo_completions_update_own" on public.todo_completions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "todo_completions_delete_own" on public.todo_completions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.todo_completions from anon;

grant select, insert, update, delete on public.todo_completions to authenticated;

-- ----------------------------------------------------------------------------
-- US 3.1: la vista UTC ahora cuenta también los completados recurrentes.
-- ----------------------------------------------------------------------------
create or replace view public.daily_epic_logs
with (security_invoker = true)
as
select
  logs.day,
  logs.epic_id,
  count(*)::integer as completed_count
from (
  select
    (t.completed_at at time zone 'UTC')::date as day,
    p.epic_id
  from public.todos t
  join public.projects p on p.id = t.project_id
  where t.completed_at is not null
  union all
  select
    (c.completed_at at time zone 'UTC')::date as day,
    p.epic_id
  from public.todo_completions c
  join public.todos t on t.id = c.todo_id
  join public.projects p on p.id = t.project_id
) logs
group by logs.day, logs.epic_id;

-- ----------------------------------------------------------------------------
-- US 3.1: logs diarios con zona horaria del cliente (unión de ambas fuentes).
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
  ),
  marks as (
    select t.completed_at, t.project_id
    from public.todos t
    where t.completed_at is not null
    union all
    select c.completed_at, t.project_id
    from public.todo_completions c
    join public.todos t on t.id = c.todo_id
  )
  select
    (m.completed_at at time zone (select tz from zone))::date as day,
    p.epic_id,
    count(*)::integer as completed_count
  from marks m
  join public.projects p on p.id = m.project_id
  where (m.completed_at at time zone (select tz from zone))::date
        >= (select today from anchor) - (greatest(p_days, 1) - 1)
  group by 1, 2
  order by 1 desc;
$$;

-- ----------------------------------------------------------------------------
-- US 3.3 + 3.4: racha actual y mejor marca por épica (misma reglas; la
-- actividad incluye los completados recurrentes).
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
  marks as (
    select t.completed_at, t.project_id
    from public.todos t
    where t.completed_at is not null
    union all
    select c.completed_at, t.project_id
    from public.todo_completions c
    join public.todos t on t.id = c.todo_id
  ),
  logs as (
    select
      (m.completed_at at time zone (select tz from zone))::date as day,
      p.epic_id
    from marks m
    join public.projects p on p.id = m.project_id
    where (m.completed_at at time zone (select tz from zone))::date
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
-- Racha global (ADR-012): misma unión de fuentes.
-- ----------------------------------------------------------------------------
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
  marks as (
    select t.completed_at
    from public.todos t
    where t.completed_at is not null
    union all
    select c.completed_at
    from public.todo_completions c
  ),
  logs as (
    select distinct (m.completed_at at time zone (select tz from zone))::date as day
    from marks m
    where (m.completed_at at time zone (select tz from zone))::date
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
