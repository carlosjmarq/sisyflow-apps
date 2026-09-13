-- ============================================================================
-- SisyFlow — Seed de desarrollo (idempotente)
-- Se ejecuta en `supabase db reset` (config.toml: [db.seed] ./seed.sql).
-- Dos usuarios de prueba (contraseña: password123, solo local):
--   ana@example.com  (11111111-1111-4111-8111-111111111111)
--   beto@example.com (22222222-2222-4222-8222-222222222222)
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- Usuarios de Auth
-- ----------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'ana@example.com',
    extensions.crypt('password123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'beto@example.com',
    extensions.crypt('password123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', ''
  )
on conflict (id) do nothing;

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (
    'd1000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '{"sub":"11111111-1111-4111-8111-111111111111","email":"ana@example.com"}',
    'email', now(), now(), now()
  ),
  (
    'd2000000-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    '{"sub":"22222222-2222-4222-8222-222222222222","email":"beto@example.com"}',
    'email', now(), now(), now()
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Épicas
-- ----------------------------------------------------------------------------
insert into public.epics (id, user_id, name, color_code)
values
  ('a1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Salud', '#22C55E'),
  ('a1000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Carrera', '#3B82F6'),
  ('a2000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Inglés', '#A855F7')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Proyectos
-- ----------------------------------------------------------------------------
insert into public.projects (id, epic_id, user_id, name, color_code, status)
values
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Entrenar 3 veces por semana', 'mint', 'active'),
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Portfolio web', 'lavender', 'active'),
  ('b2000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'IELTS', 'sky', 'paused')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Tareas (con `completed_at` histórico para probar heatmap y rachas)
-- ----------------------------------------------------------------------------
insert into public.todos (id, project_id, user_id, title, status, priority, urgency, expiration_date, content, content_format, completed_at)
values
  ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Correr 5 km', 'done', 'high', 'medium', null, '[]'::jsonb, 'blocknote', now() - interval '2 days'),
  ('c1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Gimnasio', 'done', 'high', 'high', null, '[]'::jsonb, 'blocknote', now() - interval '1 day'),
  ('c1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Estirar 10 min', 'todo', 'low', 'medium', null, '[]'::jsonb, 'blocknote', null),
  ('c1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Comprar proteína', 'backlog', 'medium', 'low', now() + interval '7 days', '[]'::jsonb, 'blocknote', null),
  ('c1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Maquetar home', 'done', 'critical', 'high', null, '[]'::jsonb, 'blocknote', now() - interval '1 day'),
  ('c1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Publicar caso de estudio', 'in-progress', 'high', 'medium', null, '[]'::jsonb, 'blocknote', null),
  ('c2000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Listening practice', 'done', 'medium', 'medium', null, '[]'::jsonb, 'blocknote', now() - interval '1 day'),
  ('c2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Speaking mock exam', 'cancelled', 'high', 'medium', null, '[]'::jsonb, 'blocknote', null),
  ('c2000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Grammar drills', 'todo', 'medium', 'low', null, '[]'::jsonb, 'blocknote', null)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Tags
-- ----------------------------------------------------------------------------
insert into public.tags (id, project_id, user_id, name, color_code)
values
  ('e1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'mañana', 'sky'),
  ('e1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'foco', 'lavender'),
  ('e2000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'examen', 'butter')
on conflict (id) do nothing;
