---
tags: [tecnico, desktop, electron]
status: borrador
date: 2026-09-13
---

# App de escritorio (base TodoDex)

## Contexto

La app de escritorio de SisyFlow parte de **TodoDex** (`TEst-Opencode`): un gestor
de tareas local multi-proyecto con estética pastel "Nintendo OS", 100% offline.
La fase `/desktop` copia su working tree a `apps/desktop/` y la renombra
([[ADR-004 Base de escritorio TodoDex a SisyFlow]]).

## Contenido

### Arquitectura

- **Electron 30 + Vite 5** (`vite-plugin-electron/simple`): `electron/main.ts`
  (ventana + carga del dev server o `dist/index.html`) y `electron/preload.ts`
  (expone `ipcRenderer` genérico por `contextBridge`; el renderer no usa IPC hoy).
- **React 18 + TypeScript estricto**, router `react-router-dom` 7 en modo HashRouter:
  - `/` — Home: grid responsive (1–4 columnas) de proyectos, orden, export/import de backup.
  - `/project/:projectId` — TodoList: toolbar de orden y filtros, secciones
    Pendientes/Completados/Cancelados, drawer de detalle.
- **Sin store global**: hooks locales (`src/hooks/useProjects.ts`) sobre Dexie que
  recargan datos tras cada mutación.
- **Datos locales**: `src/db/database.ts` (Dexie 4, base `TodoDexDB`, versión 4)
  con tablas `projects`, `todos`, `epics`, `tags`; `src/db/backup.ts` export/import JSON.
- **Editor**: BlockNote + Mantine 8 ([[Editor de contenido (BlockNote)]]).
- **Tipos y dominio**: `src/types/index.ts` (estados, prioridades, urgencias,
  colores de proyecto).
- **UI primitivas**: `src/components/ui/` (Button, Card, Dialog, ConfirmDialog,
  Input, Select, Tooltip).

### Funcionalidad actual

Inventario completo y congelado en [[Paridad funcional con TodoDex]]. En resumen:
CRUD de proyectos con color, CRUD de tareas con estado/prioridad/urgencia/
vencimiento, épicas por proyecto, tags, backup JSON y editor BlockNote por tarea.

### Deuda heredada (a corregir en la copia)

- `dist-electron/` versionado en el repo origen → no versionar en SisyFlow.
- `docs/` del origen desactualizadas (mencionan `@uiw/react-md-editor`, esquema v2)
  → su contenido útil se migra al vault, no se copia.
- Cambios sin commitear en el working tree origen (backup en UI, tags v2):
  se copia el working tree completo, no el último commit.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Paridad funcional con TodoDex]], [[Editor de contenido (BlockNote)]], [[Modelo de datos objetivo (Supabase)]]
- **ADR:** [[ADR-001 Eleccion de stack]], [[ADR-004 Base de escritorio TodoDex a SisyFlow]], [[ADR-008 Estrategia de datos nube-first]]
- **Ruta en el monorepo:** `apps/desktop/`
- **Origen:** `TEst-Opencode` (TodoDex)
