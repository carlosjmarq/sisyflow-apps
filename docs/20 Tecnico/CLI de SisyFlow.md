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
                     [--recurrence none|daily|weekdays|weekly|monthly]
                     [--due <fecha>] [--content <texto>] [--content-format blocknote|markdown]
sisyflow todo list [--project] [--status] [--json] | get <id> [--json]
sisyflow todo update <id> [--title] [--status] [--priority] [--urgency] [--recurrence]
                        [--due] [--content]
sisyflow todo check <id>            # registra un completado de una tarea recurrente
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

Orden de carga: `process.env` → `--env-file` → `~/.sisyflow/.env` → `.env` del
paquete → `apps/desktop/.env` (fallback que reutiliza `VITE_SUPABASE_URL` y
`VITE_SUPABASE_PUBLISHABLE_KEY`).

## Instalación global

Para usar `sisyflow` como comando de sistema en cualquier terminal:

1. `pnpm --filter sisyflow-cli build`
2. `pnpm add -g "C:\Users\<usuario>\...\sisyflow-apps\apps\cli"` (ruta absoluta;
   pnpm 9 resuelve las relativas contra el directorio global).
   Fallback si el paquete `private` diera problemas: `npm install -g <ruta>`.
3. Crear `~/.sisyflow/.env` (en Windows, `C:\Users\<usuario>\.sisyflow\.env`)
   con la URL y publishable key del entorno deseado (local o producción).
4. Abrir una terminal nueva y `sisyflow login` con tu cuenta real de ese proyecto.

Para actualizar tras un cambio: `pnpm --filter sisyflow-cli build` + repetir el
paso 2. El comando queda en `%LOCALAPPDATA%\pnpm` (o el `global-bin-dir` de
pnpm), que ya está en el PATH de Windows. Actualizado el 2026-09-20 con
`todo check` y `--recurrence`.

Nota: la sesión (`~/.sisyflow/session.json`) es única; si alternas entre el
Supabase local y producción, vuelve a ejecutar `login` al cambiar de entorno.

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

## Tareas recurrentes (US 4.1, ADR-014)

- `--recurrence` en `todo create`/`todo update` (`none` por defecto); la columna
  REPETICIÓN se muestra en `list`/`get`.
- `sisyflow todo check <id>` inserta un completado en `todo_completions` con la
  fecha y hora actuales; falla con exit code 1 si la tarea no existe o no es
  recurrente.
- Los completados alimentan el heatmap y las rachas igual que en el desktop
  ([[Gamificacion]]).

## Restricciones de integridad

- `epic delete` falla si la épica tiene proyectos (FK `on delete restrict`,
  [[ADR-010 Ciclo de vida de proyectos y vista del dia]]).
- `project delete` borra sus tareas en cascada (se advierte y exige `--yes`).
- El contenido de una tarea se **normaliza a bloques BlockNote** y se guarda con
  `content_format = 'blocknote'` (formato canónico que consumen el desktop y el
  móvil). `--content-format` describe el formato de **entrada**: `markdown` se
  parsea con `marked` (encabezados, listas, citas, código, énfasis y links);
  `blocknote` acepta JSON de bloques tal cual o, si es texto, un párrafo por
  línea.

## Historial

### Corrección de contenido (2026-09-26)

Bug: `todo create`/`todo update`/`import` guardaban el contenido como JSON de
bloques BlockNote pero etiquetaban `content_format = 'markdown'` cuando se pedía
ese formato. El desktop, al leer una fila `markdown`, interpretaba el JSON como
markdown y mostraba el blob crudo (el array JSON literal) en el editor.

Corrección: `apps/cli/src/lib/content.ts` ahora convierte markdown → bloques
BlockNote con `marked` (`markdownToBlocks`), el texto plano a un párrafo por
línea (`plainTextToBlocks`) y acepta JSON de bloques como passthrough; todas las
altas/ediciones guardan `content_format = 'blocknote'`. Requiere la dependencia
`marked` (misma que el desktop).

Migración de datos: el 2026-09-26 se detectaron **27 de 106** tareas con
`content_format = 'markdown'` (contenido roto). Se repararon con un script de una
vez que extrajo el markdown de cada fila (estaba en `content[0].content[0].text`),
lo reconvirtió con `markdownToBlocks` y reguardó `content_format = 'blocknote'`;
quedaron 0 filas con `markdown`. Backup del contenido previo en
`%TEMP%\opencode\todos_markdown_backup_<fecha>.json`. Para tareas futuras, usar
`todo update <id> --content "<markdown>" --content-format markdown`.

## Pendientes

- [x] Smoke test manual contra Supabase local con el seed (ana@example.com),
      hecho el 2026-09-20: login, `todo create --recurrence`, `todo check`,
      `todo update --recurrence` y `todo list` con `--json`.
- [ ] Considerar extraer `parseContent` a un paquete compartido si el CLI crece.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Capa de datos Supabase]], [[Modelo de datos objetivo (Supabase)]]
- **ADR:** [[ADR-013 CLI de SisyFlow]]
- **Ruta en el monorepo:** `apps/cli/`