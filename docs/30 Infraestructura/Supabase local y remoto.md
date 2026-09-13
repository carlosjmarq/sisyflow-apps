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
- `supabase start` levanta el stack: API (54321), Postgres (54322), Studio
  (54323), Inbucket de correos (54324) — puertos por defecto del CLI.
- `supabase db reset` recrea la base local aplicando migraciones + `seed.sql`.
- Las claves locales (URL + anon key) se copian del `supabase status` al `.env`
  del desktop (gitignored).

### Remoto (uso real)

- Proyecto Supabase dedicado (plan gratuito alcanza para un usuario).
- Flujo: `supabase link` (una vez) → `supabase db push` para aplicar migraciones.
- Auth: email/contraseña habilitado; sin proveedores sociales por ahora.
- El desktop consume URL + anon key de producción por variables de entorno.
- `service_role` nunca viaja al cliente ([[ADR-005 Supabase como backend]]).

### Toolchain

- Supabase CLI verificada: **2.98.2** (existe 2.117.0; decidir actualización en `/setup`).
- Versiones y comandos completos en [[Setup y herramientas]].

## Pendientes

- [ ] Actualizar Supabase CLI (o justificar quedarse en 2.98.2).
- [ ] Crear el proyecto remoto al llegar a `/cloud`.
- [ ] Definir rutina de respaldo (dump programado o export manual).

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Backend Supabase]], [[Builds de escritorio (Windows)]]
- **ADR:** [[ADR-005 Supabase como backend]], [[ADR-008 Estrategia de datos nube-first]]
- **Ruta en el monorepo:** `backend/supabase/`
