---
tags: [tecnico, desktop, electron]
status: borrador
date: 2026-09-13
---

# App de escritorio (base TodoDex)

## Contexto

La app de escritorio de SisyFlow parte de **TodoDex** (`TEst-Opencode`): un gestor
de tareas local multi-proyecto con estética pastel "Nintendo OS", 100% offline.
La fase `/desktop` copió su working tree a `apps/desktop/` y la renombró a
SisyFlow el 2026-09-13 ([[ADR-004 Base de escritorio TodoDex a SisyFlow]]).

## Contenido

### Estado actual (Fases 1–3)

- Paquete `sisyflow-desktop@0.1.0` dentro del workspace pnpm de la raíz
  (`pnpm-workspace.yaml`, `.npmrc` con `node-linker=hoisted`).
- Verificado el 2026-09-13: `pnpm lint`, `npx tsc --noEmit` y `pnpm dev`
  (Vite + Electron) en verde.
- Renombre: `appId com.sisyflow.app`, `productName SisyFlow`, títulos de UI.
- **Fase 3**: auth Supabase con sesión persistente, capa de datos nube-first
  ([[Capa de datos Supabase]]), migración Sísifo desde Dexie en Configuración y
  backup v3. Nuevas carpetas `src/auth/`, `src/data/`, `src/lib/`,
  `src/migration/`; `.env` (gitignored) con URL y publishable key.
- Se conservan a propósito el nombre de base Dexie `TodoDexDB` (la migración
  Sísifo debe leer esos datos) y la clave `tododex.drawerWidth`; el backup ahora
  exporta `sisyflow-backup-<fecha>.json`.
- **Fase 4**: pantalla Épicas (`/epics`) con CRUD y color, estados de proyecto
  (activo/pausado/completado), Home agrupado por épica con vista "Tareas del
  día" y `completed_at` visible en el drawer
  ([[ADR-010 Ciclo de vida de proyectos y vista del dia]]).
- **Fase 5**: pantalla Progreso (`/progress`) con heatmap de 365 días (global o
  por épica) y rachas 🔥 por épica
  ([[ADR-011 Gamificacion zona horaria rachas y heatmap]]).
- **Rediseño UI Material Design 3** ([[ADR-012 Rediseno UI Material Design 3]]):
  shell con navigation rail (Inicio/Épicas/Ajustes), top app bar contextual, FAB
  y snackbar; Inicio progress-first (hero de racha, heatmap compacto expandible,
  chips de racha por épica, tareas del día y proyectos); se elimina la ruta
  `/progress` (absorbida por Inicio); búsqueda global y tags por proyecto con UI;
  tema claro/oscuro persistido. (Fase 6 `/deliver` aún pendiente.)

### Arquitectura

- **Electron 30 + Vite 5** (`vite-plugin-electron/simple`): `electron/main.ts`
  (ventana + carga del dev server o `dist/index.html`) y `electron/preload.ts`
  (expone `ipcRenderer` genérico por `contextBridge`; el renderer no usa IPC hoy).
  La ventana arranca en 1280x840 con mínimo 960x640 y `backgroundColor` acorde al
  tema activo para evitar el destello blanco.
- **React 18 + TypeScript estricto**, router `react-router-dom` 7 en modo HashRouter.
  El shell ([[ADR-012 Rediseno UI Material Design 3]]) define el navigation rail
  con tres destinos:
  - `/` — Inicio progress-first (orden fijo): hero de racha, heatmap compacto
    expandible, chips de racha por épica, tareas del día y proyectos agrupados por
    épica. Absorbe el progreso; la ruta `/progress` se eliminó.
  - `/epics` — Épicas: CRUD y color.
  - `/project/:projectId` — TodoList: toolbar de orden y filtros, secciones
    Pendientes/Completados/Cancelados, drawer de detalle y gestor de tags.
  - `/settings` — Ajustes: tema, cuenta, migración Sísifo y backup.
- **Sin store global**: hooks sobre Supabase con UI optimista
  ([[Capa de datos Supabase]]); los componentes no importan el cliente.
- **Datos locales**: `src/db/database.ts` (Dexie 4, base `TodoDexDB`, versión 4)
  se conserva únicamente como origen de la migración Sísifo;
  `src/db/backup.ts` export/import JSON.
- **Editor**: BlockNote + Mantine 8 ([[Editor de contenido (BlockNote)]]).
- **Tipos y dominio**: `src/types/index.ts` (estados, prioridades, urgencias,
  colores de proyecto).
- **Tema**: `src/theme/` (`ThemeProvider`, `ThemeContext`) con preferencia
  persistida y toggle claro/oscuro.
- **Shell**: `src/components/shell/` (`AppShell`, `NavigationRail`, `TopAppBar`,
  `SearchOverlay`, `ShellContext`).
- **UI primitivas**: `src/components/ui/` (Button, IconButton, Fab, Card, Chip,
  SegmentedButton, TextField, Select, Dialog, ConfirmDialog, Menu, Tooltip,
  Skeleton/Spinner, ColorPicker, Icon; snackbar vía `ToastProvider`). El drawer de
  detalle se portaliza a `document.body`.
- **Dependencias UI**: `motion` (animaciones MD3) y `material-symbols`
  (iconografía Rounded auto-hospedada); se retira `lucide-react`.

### Funcionalidad actual

Inventario completo y congelado en [[Paridad funcional con TodoDex]]. En resumen:
CRUD de proyectos con color, CRUD de tareas con estado/prioridad/urgencia/
vencimiento, épicas por proyecto, tags, backup JSON y editor BlockNote por tarea.

### Deuda heredada (tratada en la copia)

- `dist-electron/` estaba versionado en el origen → ignorado en SisyFlow por el
  `.gitignore` raíz; se regenera con Vite y no se versiona.
- `docs/` del origen desactualizadas (mencionan `@uiw/react-md-editor`, esquema v2)
  → no se copiaron; el vault las supersede.
- Cambios sin commitear en el working tree origen (backup en UI, tags v2):
  copiados tal cual (se copió el working tree completo, no el último commit).

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Paridad funcional con TodoDex]], [[Editor de contenido (BlockNote)]], [[Modelo de datos objetivo (Supabase)]]
- **ADR:** [[ADR-001 Eleccion de stack]], [[ADR-004 Base de escritorio TodoDex a SisyFlow]], [[ADR-008 Estrategia de datos nube-first]]
- **Ruta en el monorepo:** `apps/desktop/`
- **Origen:** `TEst-Opencode` (TodoDex)
