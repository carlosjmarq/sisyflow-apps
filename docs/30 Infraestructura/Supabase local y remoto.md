---
tags: [infraestructura, supabase]
status: borrador
date: 2026-09-13
---

# Supabase local y remoto

## Contexto

SisyFlow usa Supabase en dos entornos: **local** (CLI + Docker) para desarrollar
y probar migraciones/RLS, y **remoto** (proyecto gestionado) para el uso real de
la app. Ver [[ADR-005 Supabase como backend]] y [[Backend Supabase]].

## Contenido

### Local (desarrollo)

- Requiere Docker Desktop corriendo.
- `supabase start` levanta el stack en puertos **453xx** (no los 543xx por
  defecto): Windows reserva el rango 54226–54325 y Docker no puede exponerlos.
  API 45321, Postgres 45322, Studio 45323, Mailpit 45324.
- Analytics deshabilitado (`[analytics] enabled = false`): en Windows requeriría
  exponer el daemon Docker en `tcp://localhost:2375`.
- Claves locales: **publishable** (para el cliente) y **secret** (solo
  administración); `supabase status` las muestra.
- `supabase db reset` recrea la base local aplicando migraciones + `seed.sql`.
- Tests de RLS: `supabase test db` (pgTAP; 22 aserciones en verde).
- Las claves locales se copian del `supabase status` al `.env` del desktop
  (gitignored).

### Remoto (uso real)

- Proyecto Supabase dedicado (plan gratuito alcanza para un usuario).
- Flujo: `supabase link` (una vez) → `supabase db push` para aplicar migraciones.
- Auth: email/contraseña habilitado; sin proveedores sociales por ahora.
- El desktop consume URL + anon key de producción por variables de entorno.
- `service_role` nunca viaja al cliente ([[ADR-005 Supabase como backend]]).

### Toolchain

- Supabase CLI: **2.117.0** (actualizada el 2026-09-13).
- Versiones y comandos completos en [[Setup y herramientas]].

## Pendientes

- [x] Supabase CLI actualizada a 2.117.0 (2026-09-13).
- [ ] Crear el proyecto remoto al llegar a `/cloud`.
- [ ] Definir rutina de respaldo (dump programado o export manual).

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Backend Supabase]], [[Builds de escritorio (Windows)]]
- **ADR:** [[ADR-005 Supabase como backend]], [[ADR-008 Estrategia de datos nube-first]]
- **Ruta en el monorepo:** `backend/supabase/`
