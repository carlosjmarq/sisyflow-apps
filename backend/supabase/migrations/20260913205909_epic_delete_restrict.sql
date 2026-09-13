-- ============================================================================
-- SisyFlow — Protección del historial al borrar épicas (ADR-010)
-- Una épica con proyectos no se puede borrar: primero hay que moverlos.
-- ============================================================================

alter table public.projects drop constraint if exists projects_epic_id_fkey;

alter table public.projects
  add constraint projects_epic_id_fkey
  foreign key (epic_id) references public.epics (id) on delete restrict;
