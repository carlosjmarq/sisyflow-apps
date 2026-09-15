---
tags: [nota, tecnico, cli, automatizacion]
status: activo
date: 2026-09-14
---

# CLI de SisyFlow

Herramienta de consola (binario `sisyflow`) para operar la capa de datos de
SisyFlow fuera de la app de escritorio: CRUD de épicas, proyectos y tareas,
autenticación persistente e importación masiva. Decisión: [[ADR-013 CLI de SisyFlow]].

## Ubicación

- **Paquete:** `apps/cli/` (workspace pnpm `sisyflow-cli`, glob `apps/*`).
- **Entrada:** `src/cli.ts` (Commander). Binario `sisyflow` → `dist/cli.js`.
- **Uso en desarrollo:** `pnpm cli <args>` desde la raíz (o
  `pnpm --filter sisyflow-cli start <args>`). En pnpm 9 de Windows los args van
  directos tras el nombre del script, sin separador `--`.
- **Backend:** Supabase (mismo proyecto local o remoto que el desktop).

## Comandos

```
sisyflow help                      # y cada subcomando tiene --help propio
sisyflow login [--email] [--password]
sisyflow logout | whoami

sisyflow epic create --name <n> [--color <hex|paleta>]
sisyflow epic list [--json] | get <id|nombre> [--json]
sisyflow epic update <id|nombre> [--name] [--color]
sisyflow epic delete <id|nombre> [--yes]

sisyflow project create --name <n> --epic <id|nombre> [--color] [--status active|paused|completed]
sisyflow project list [--epic <id|nombre>] [--json] | get <id|nombre> [--json]
sisyflow project update <id|nombre> [--name] [--epic] [--color] [--status]
sisyflow project delete <id|nombre> [--yes]

sisyflow todo create --title <t> --project <id|nombre> [--status] [--priority] [--urgency]
                     [--due <fecha>] [--content <texto>] [--content-format blocknote|markdown]
sisyflow todo list [--project] [--status] [--json] | get <id> [--json]
sisyflow todo update <id> [--title] [--status] [--priority] [--urgency] [--due] [--content]
sisyflow todo delete <id> [--yes]

sisyflow import <archivo.json>     # épicas/proyectos/tareas en lote
```

Flags globales: `--json`, `--env-file`, `--yes`. Datos a stdout, errores a
stderr. Exit codes: `0` éxito, `1` error de ejecución, `2` uso inválido.

## Autenticación

- `sisyflow login` con email/contraseña; guarda la sesión
  (`access_token`, `refresh_token`, `expires_at`) en `~/.sisyflow/session.json`
  con permisos 0600. Cada comando refresca la sesión automáticamente si expiró.
- Para scripts: flags `--email`/`--password` o env `SISYFLOW_EMAIL`/
  `SISYFLOW_PASSWORD`.
- El CLI usa solo la **publishable key** + RLS `auth.uid() = user_id`; jamás
  `service_role`.

## Entorno

Orden de carga: `process.env` → `apps/cli/.env` → `apps/desktop/.env`
(fallback que reutiliza `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`).

## Tipos generados

Tras cada cambio de esquema se regenera `apps/cli/src/types/supabase.ts` junto
con el del desktop (mismo `supabase gen types typescript`, con `cmd /c` en
Windows para evitar el redirect UTF-16 de PowerShell 5.1).

## Automatización

- Salida `--json` parseable y exit codes estables para encadenar en scripts.
- Resolución por **id o nombre** en `--epic`/`--project` (error claro ante
  duplicados).
- `sisyflow import <archivo.json>` crea épicas, proyectos y tareas en lote
  (validado con zod), reportando cantidades y errores por fila.

## Restricciones de integridad

- `epic delete` falla si la épica tiene proyectos (FK `on delete restrict`,
  [[ADR-010 Ciclo de vida de proyectos y vista del dia]]).
- `project delete` borra sus tareas en cascada (se advierte y exige `--yes`).
- El contenido de una tarea se guarda como bloque blocknote (párrafo) o como
  `markdown` según `--content-format`.

## Pendientes

- [ ] Smoke test manual contra Supabase local con el seed (ana@example.com).
- [ ] Considerar extraer `parseContent` a un paquete compartido si el CLI crece.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Capa de datos Supabase]], [[Modelo de datos objetivo (Supabase)]]
- **ADR:** [[ADR-013 CLI de SisyFlow]]
- **Ruta en el monorepo:** `apps/cli/`