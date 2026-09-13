---
tags: [adr, decision, backend, supabase]
status: Aceptado
date: 2026-09-13
---

# ADR-005 Supabase como backend

## Status

Aceptado

## Contexto

US 1.1 pide que la app Electron se conecte a un proyecto de Supabase mediante
autenticación segura para sincronizar los datos en PostgreSQL. El proyecto es
personal, de un solo usuario por cuenta, y no justifica operar un backend propio
(API + servidor + despliegue). Las alternativas consideradas fueron un backend
FastAPI/Node con Postgres administrado y Firebase; se descartan por mayor costo
de operación y menor afinidad con el modelo relacional (jerarquía Épica >
Proyecto > Tarea, vista `daily_epic_logs`).

## Decisión

- Backend Supabase: **Postgres + Auth email/contraseña + RLS** ([[Backend Supabase]]).
- La app usa el SDK `@supabase/supabase-js` con la **anon key**; la clave
  `service_role` nunca se incluye en la app de escritorio.
- **RLS obligatoria** en todas las tablas con `user_id`, con políticas
  `auth.uid() = user_id` (US 1.1). Se prueba con dos usuarios distintos.
- La sesión persiste localmente en Electron para no pedir login en cada apertura.
- Migraciones y desarrollo local con Supabase CLI + Docker ([[Supabase local y remoto]]).
- Edge Functions solo si un ADR justifica su necesidad; por defecto, lógica en SQL
  (vistas, triggers) o en el cliente.
- Tipos TypeScript generados desde el esquema y consumidos por el desktop.

## Consecuencias

### Positivas

- Autenticación, almacenamiento y seguridad gestionados; sin servidores propios.
- Postgres permite modelar la jerarquía y la vista de gamificación con SQL eficiente.
- RLS acota los datos por usuario en el motor, no en el cliente.

### Negativas / Trade-offs

- Dependencia de un proveedor externo y de su disponibilidad.
- RLS mal diseñada puede filtrar datos: requiere pruebas explícitas por tabla.
- El desarrollo local necesita Docker corriendo.

### Neutrales

- La app se conecta directo a la base desde el cliente (sin capa API intermedia);
  toda la seguridad descansa en RLS.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-001 Eleccion de stack]], [[ADR-008 Estrategia de datos nube-first]], [[ADR-007 Jerarquia Epicas Proyectos Tareas]]
- **Afecta a:** [[Backend Supabase]], [[Modelo de datos objetivo (Supabase)]], [[Supabase local y remoto]]
- **Repo:** `backend/supabase/`, `apps/desktop/src/` (cliente)
