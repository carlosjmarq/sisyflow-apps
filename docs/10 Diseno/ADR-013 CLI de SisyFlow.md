---
tags: [adr, decision, cli, automatizacion]
status: Aceptado
date: 2026-09-14
---

# ADR-013 CLI de SisyFlow

## Status

Aceptado

## Contexto

La app de escritorio de SisyFlow opera contra Supabase con RLS
(`auth.uid() = user_id`, US 1.1) y no hay forma de interactuar con la capa de
datos fuera de la UI. Se necesita una herramienta de consola que permita el
CRUD de épicas, proyectos y tareas de forma programática, para automatizar la
creación de tareas recurrentes (rutinas diarias, batches por proyecto, scripts
de mantenimiento).

Fuerzas en juego:

- **Automatización**: los comandos deben ser componibles desde scripts
  (PowerShell, bash, CI) con salida parseable y exit codes correctos.
- **Seguridad**: el CLI debe respetar el modelo de datos existente: solo
  publishable key + RLS, jamás `service_role` (ADR-005, reglas de backend).
- **Descubribilidad**: un comando `help` claro y `--help` por subcomando.
- **Coherencia con el monorepo**: TypeScript estricto, pnpm workspace
  (`apps/*`), tipos generados desde Supabase.
- **Sin duplicar secretos**: reutilizar la configuración de entorno existente.

Alternativas consideradas:

- **Rust/Go compilado**: binario nativo, pero rompe la coherencia del stack y
  obliga a mantener tipos duplicados sin `supabase gen types`.
- **Solo env vars por invocación**: sin sesión persistente, incómodo para uso
  interactivo y sin beneficio real para scripts.
- **Sin import masivo**: encadenar comandos CRUD basta, pero dificulta la
  creación de decenas de tareas en una sola operación atómica por lote.

## Decisión

Crear un paquete workspace **`apps/cli`** (`sisyflow-cli`) en Node + TypeScript
estricto + **Commander**, con binario `sisyflow`. Expone el CRUD de épicas,
proyectos y tareas contra Supabase, autenticación persistente, salida `--json`
y un comando de importación masiva desde JSON.

Detalles:

- **Stack**: Node 20+, TypeScript estricto, `commander` (genera `--help`),
  `dotenv`, `picocolors` (salida legible) y `zod` (validación de flags/import).
- **Auth**: `sisyflow login` (email/contraseña) que persiste la sesión en
  `~/.sisyflow/session.json` con refresh automático; `--email/--password` y env
  `SISYFLOW_EMAIL/SISYFLOW_PASSWORD` para scripts. `logout` y `whoami`.
- **Entorno**: el CLI lee `process.env`, luego `apps/cli/.env` y como fallback
  `apps/desktop/.env` (reutiliza `VITE_SUPABASE_URL` y
  `VITE_SUPABASE_PUBLISHABLE_KEY`; nunca la key service/secret).
- **Tipos**: los tipos generados de Supabase se emiten también a
  `apps/cli/src/types/supabase.ts` con el mismo comando `supabase gen types`.
- **Resolución por nombre**: `--epic` y `--project` aceptan uuid o nombre
  exacto (error claro ante duplicados) para automatizar sin memorizar UUIDs.
- **Restricciones respetadas**: `epic delete` con proyectos falla (FK
  `on delete restrict`, ADR-010); `project delete` advierte que borra sus
  tareas (cascade); confirmación con `--yes`.
- **Salida**: datos a stdout, errores a stderr; `--json` para parsear; exit
  codes `0` éxito, `1` error de ejecución, `2` uso inválido.

## Consecuencias

### Positivas

- Automatización real de la creación de tareas (rutinas, batches, CI).
- Misma capa de seguridad que la app: RLS `auth.uid() = user_id`, solo
  publishable key.
- `help` y `--help` auto-generados, descubribilidad inmediata.
- Comparte tipos generados y convenciones del monorepo (lint + tsc verdes).

### Negativas / Trade-offs

- Mantener dos destinos de generación de tipos (desktop y CLI): un fallo al
  regenerar desincroniza el CLI hasta la próxima generación.
- El login persistente guarda tokens en el home del usuario; si el token se
  filtra, expone los datos del usuario (mitigado con permisos 0600 y refresh).

### Neutrales

- La lógica de `parseContent` (texto → bloque blocknote) se duplica en el CLI;
  si crece, se extrae a un paquete compartido.
- El CLI no toca la UI del desktop ni la paridad funcional.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-005 Supabase como backend]], [[ADR-008 Estrategia de datos nube-first]], [[ADR-010 Ciclo de vida de proyectos y vista del dia]]
- **Afecta a:** [[CLI de SisyFlow]] (nota técnica), `apps/cli/`
- **Repo:** `apps/cli/`