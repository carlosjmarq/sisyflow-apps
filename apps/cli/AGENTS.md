# apps/cli — CLI de SisyFlow (`sisyflow`)

Herramienta de consola para operar la capa de datos de SisyFlow fuera de la app:
CRUD de épicas, proyectos y tareas contra Supabase, con autenticación
persistente e importación masiva. Parte del monorepo `sisyflow-apps`
([[ADR-013 CLI de SisyFlow]]).

## Stack

- Node 20+ / TypeScript estricto (NodeNext) / ESM
- `commander` (subcomandos + `--help`), `dotenv`, `picocolors`, `zod`
- Datos: Supabase con solo publishable key + RLS `auth.uid() = user_id`
- Sesión persistente en `~/.sisyflow/session.json` (login/logout/whoami)

## Estructura

```
apps/cli/
├── src/
│   ├── cli.ts            # programa Commander + registro de subcomandos
│   ├── lib/
│   │   ├── env.ts        # dotenv: process.env > apps/cli/.env > apps/desktop/.env
│   │   ├── client.ts     # cliente Supabase + requireSession (login/refresh)
│   │   ├── session.ts    # persistencia de sesión en ~/.sisyflow
│   │   ├── resolve.ts    # resolución id|nombre (épicas/proyectos)
│   │   ├── validate.ts   # enums zod + parseo de fechas
│   │   ├── format.ts     # tabla humana + --json + errores
│   │   └── errors.ts     # CliError y exit codes
│   └── commands/         # auth, epic, project, todo, import
│       └── types/supabase.ts  # tipos generados
├── package.json          # bin: sisyflow → dist/cli.js
├── tsconfig.json
└── .env.example
```

## Comandos (dev)

Instalar desde la raíz del monorepo (workspace pnpm):

```
pnpm install
pnpm --filter sisyflow-cli start <args>   # o: pnpm cli <args> (desde la raíz)
pnpm --filter sisyflow-cli build
pnpm --filter sisyflow-cli lint
pnpm --filter sisyflow-cli typecheck
```

Nota (pnpm 9 en Windows): los argumentos van **directamente** tras el nombre del
script, sin separador `--` (este pnpm lo reenvía literal y rompe el parseo).
Ejemplo: `pnpm cli --json epic list`, `pnpm cli help`, `pnpm cli epic --help`.

Referencia completa de comandos: nota [[CLI de SisyFlow]] del vault.

## Reglas

- El CLI usa **solo** la publishable key + RLS; jamás `service_role` (ADR-005).
- Secretos solo en `.env` (gitignored) o variables de entorno; nunca hardcodeados.
- Datos a stdout, errores a stderr; exit codes `0` éxito, `1` error de ejecución,
  `2` uso inválido. `--json` para salida parseable.
- `--epic`/`--project` aceptan **uuid o nombre** (error claro ante duplicados).
- `epic delete` con proyectos falla (FK restrict, ADR-010); `project delete`
  borra tareas en cascada y exige `--yes`.
- Tipos generados: regenerar `src/types/supabase.ts` junto con el del desktop
  tras cada cambio de esquema (mismo `supabase gen types`, `cmd /c` en Windows).
- Cargar skills antes de codificar: `supabase`, `sisyflow-db`.
- Vault antes/después de cada tarea; commits `feat(cli)`.

## DoD

- `pnpm lint` y `pnpm typecheck` verdes en `apps/cli`.
- Smoke test contra Supabase local con el seed (`ana@example.com`): login,
  CRUD de épica/proyecto/tarea, `--json`, import, update y delete.
- Vault actualizado (nota + MOC).