---
tags: [adr, decision, stack]
status: Aceptado
date: 2026-09-13
---

# ADR-001 Elección de stack

## Status

Aceptado

## Contexto

SisyFlow nace de TodoDex ([[App de escritorio (base TodoDex)]]), una app Electron
local sin backend con editor de contenido BlockNote. Las user stories del backlog
([[US's for personal development project]]) piden dar el salto a la nube
(Postgres gestionado, autenticación, RLS) y añadir gamificación (heatmap, rachas).

Se necesita un stack que reutilice el código existente de la app de escritorio,
permita evolucionar a nube sin reescribir la UI y sea mantenible por un solo
desarrollador asistido por IA.

## Decisión

- **Desktop:** Electron 30 + Vite 5 + React 18 + TypeScript estricto + Tailwind CSS 3.
  Editor de contenido BlockNote + Mantine 8. Router react-router-dom 7 (HashRouter).
- **Datos:** Dexie 4 (IndexedDB) durante la migración; Supabase como destino
  ([[ADR-008 Estrategia de datos nube-first]]).
- **Backend:** Supabase (Postgres + Auth email/contraseña + RLS + CLI para migraciones).
- **Tooling:** pnpm con `node-linker=hoisted`; ESLint; `tsc --noEmit` como typecheck.
- **Estado en la app:** sin store global (zustand/redux); hooks + capa de datos,
  como el proyecto base.

## Consecuencias

### Positivas

- Todo el código y los componentes de TodoDex se reutilizan; la migración es incremental.
- Supabase elimina la necesidad de operar servidores propios.
- React + Tailwind permite iterar rápido en la UI del heatmap y las rachas.

### Negativas / Trade-offs

- La app depende de un proveedor externo (Supabase) para su operación (ver ADR-008).
- Electron requiere cuidado de seguridad (contextIsolation, sin `nodeIntegration`)
  y builds firmados manualmente ([[Builds de escritorio (Windows)]]).
- Sin store global, el estado compartido entre vistas debe resolverse con hooks
  y recarga tras mutación.

### Neutrales

- El editor de contenido sigue siendo BlockNote (no se migra a otro editor).
- TypeScript estricto obliga a mantener tipos de dominio actualizados
  ([[Modelo de datos objetivo (Supabase)]]).

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-004 Base de escritorio TodoDex a SisyFlow]], [[ADR-005 Supabase como backend]], [[ADR-008 Estrategia de datos nube-first]]
- **Afecta a:** [[App de escritorio (base TodoDex)]], [[Backend Supabase]]
- **Repo:** `apps/desktop/`, `backend/supabase/`
