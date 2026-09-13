-- ============================================================================
-- SisyFlow — Esquema inicial
-- Referencia: docs/20 Tecnico/Modelo de datos objetivo (Supabase).md
-- (US 1.1, US 2.1–2.3, US 3.1 + guardrail de paridad con TodoDex)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tipos
-- ----------------------------------------------------------------------------
create type public.project_status as enum ('active', 'paused', 'completed');
create type public.todo_status as enum ('backlog', 'todo', 'in-progress', 'done', 'cancelled');
create type public.task_priority as enum ('low', 'medium', 'high', 'critical');

-- ----------------------------------------------------------------------------
-- Tablas
-- ----------------------------------------------------------------------------

-- Áreas de vida continuas (US 2.1). Sin estado de completado.
create table public.epics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  color_code text not null,
  created_at timestamptz not null default now()
);

-- Proyectos finitos, siempre dentro de una épica (US 2.2).
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  epic_id uuid not null references public.epics (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  color_code text,
  status public.project_status not null default 'active',
  created_at timestamptz not null default now()
);

-- Tareas: empujes diarios. Conserva los campos actuales de TodoDex (paridad).
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  status public.todo_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  urgency public.task_priority not null default 'medium',
  expiration_date timestamptz,
  content jsonb not null default '[]'::jsonb,
  content_format text not null default 'blocknote' check (content_format in ('blocknote', 'markdown')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tags por proyecto (paridad; color opcional).
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  color_code text
);

-- ----------------------------------------------------------------------------
-- Índices (las FK no se indexan solas; `completed_at` alimenta la vista 3.1)
-- ----------------------------------------------------------------------------
create index epics_user_id_idx on public.epics (user_id);
create index projects_user_id_idx on public.projects (user_id);
create index projects_epic_id_idx on public.projects (epic_id);
create index todos_user_id_idx on public.todos (user_id);
create index todos_project_id_idx on public.todos (project_id);
create index todos_status_idx on public.todos (status);
create index todos_completed_at_idx on public.todos (completed_at) where completed_at is not null;
create index tags_user_id_idx on public.tags (user_id);
create index tags_project_id_idx on public.tags (project_id);

-- ----------------------------------------------------------------------------
-- Timestamps automáticos (US 2.3): completed_at al pasar a 'done', se limpia
-- al salir de 'done'; updated_at en cada escritura.
-- ----------------------------------------------------------------------------
create or replace function public.set_todo_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.status = 'done' then
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger todos_set_timestamps
  before insert or update on public.todos
  for each row execute function public.set_todo_timestamps();

-- ----------------------------------------------------------------------------
-- Vista de gamificación (US 3.1): [día, epic_id, cantidad completada].
-- security_invoker: respeta la RLS de las tablas subyacentes.
-- Nota: el corte del día usa UTC por ahora; la zona horaria local se decide en /gamification.
-- ----------------------------------------------------------------------------
create view public.daily_epic_logs
with (security_invoker = true)
as
select
  (t.completed_at at time zone 'UTC')::date as day,
  p.epic_id,
  count(*)::integer as completed_count
from public.todos t
join public.projects p on p.id = t.project_id
where t.completed_at is not null
group by 1, 2;

-- ----------------------------------------------------------------------------
-- RLS: cada usuario solo accede a sus filas (US 1.1)
-- ----------------------------------------------------------------------------
alter table public.epics enable row level security;
alter table public.projects enable row level security;
alter table public.todos enable row level security;
alter table public.tags enable row level security;

-- epics
create policy "epics_select_own" on public.epics
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "epics_insert_own" on public.epics
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "epics_update_own" on public.epics
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "epics_delete_own" on public.epics
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- projects
create policy "projects_select_own" on public.projects
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "projects_insert_own" on public.projects
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "projects_update_own" on public.projects
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "projects_delete_own" on public.projects
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- todos
create policy "todos_select_own" on public.todos
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "todos_insert_own" on public.todos
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "todos_update_own" on public.todos
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "todos_delete_own" on public.todos
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- tags
create policy "tags_select_own" on public.tags
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "tags_insert_own" on public.tags
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "tags_update_own" on public.tags
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "tags_delete_own" on public.tags
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- Permisos del Data API: solo `authenticated` (el rol `anon` no accede)
-- ----------------------------------------------------------------------------
revoke all on public.epics, public.projects, public.todos, public.tags from anon;
revoke all on public.daily_epic_logs from anon;

grant select, insert, update, delete
  on public.epics, public.projects, public.todos, public.tags
  to authenticated;
grant select on public.daily_epic_logs to authenticated;
