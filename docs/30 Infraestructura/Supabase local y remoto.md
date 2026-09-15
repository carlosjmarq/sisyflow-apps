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

- Proyecto **sisyflow** creado el 2026-09-13 en la org `kbeodhtjvxixmceccprb`:
  ref `djjttyejsbicmrvmgyep`, región East US (North Virginia, `us-east-1`).
- Las 4 migraciones se aplicaron con `supabase link` + `supabase db push`;
  `supabase migration list` confirma local y remoto sincronizados.
- Claves del proyecto: **publishable** (`sb_publishable_…`, la usa el desktop) y
  **secret** (`sb_secret_…`, solo administración; nunca va en la app). El
  proyecto también expone las claves legacy `anon`/`service_role` por
  compatibilidad.
- La contraseña de la base se define al crear el proyecto y **no se guarda en el
  repo**; administrarla desde el dashboard o un gestor de contraseñas.
- El desktop consume URL + publishable key de producción vía
  `apps/desktop/.env.production` (gitignored) al generar el instalador
  ([[Builds de escritorio (Windows)]]).
- Flujo de despliegue: `supabase link` (una vez) → `supabase db push` por cada
  migración nueva → regenerar el instalador.
- Auth: email/contraseña con **confirmación por email**
  (`enable_confirmations = true`). `config.toml` declara
  `site_url = "sisyflow://auth/callback"` y la allowlist
  `additional_redirect_urls` incluye el deep link y los localhost de desarrollo;
  se aplicó al remoto con `supabase config push`. Los correos de confirmación y
  recuperación vuelven a la app instalada ([[Builds de escritorio (Windows)]]).

### Toolchain

- Supabase CLI: **2.117.0** (actualizada el 2026-09-13).
- Versiones y comandos completos en [[Setup y herramientas]].

## Pendientes

- [x] Supabase CLI actualizada a 2.117.0 (2026-09-13).
- [x] Crear el proyecto remoto y aplicar las migraciones (2026-09-13).
- [x] Configurar Site URL/redirects de Auth con el deep link
      `sisyflow://auth/callback` (2026-09-13).
- [ ] Definir rutina de respaldo (dump programado o export manual).

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Backend Supabase]], [[Builds de escritorio (Windows)]]
- **ADR:** [[ADR-005 Supabase como backend]], [[ADR-008 Estrategia de datos nube-first]]
- **Ruta en el monorepo:** `backend/supabase/`
