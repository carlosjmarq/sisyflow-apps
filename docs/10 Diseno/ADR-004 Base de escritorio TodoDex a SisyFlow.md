---
tags: [adr, decision, desktop, migracion]
status: Aceptado
date: 2026-09-13
---

# ADR-004 Base de escritorio: TodoDex a SisyFlow

## Status

Aceptado — implementado en la Fase 1 (2026-09-13).

## Contexto

`TEst-Opencode` (TodoDex) es una app Electron funcional de gestión de tareas
multi-proyecto con editor de contenido BlockNote, 100% offline (Dexie). Fue la
idea base de SisyFlow. Su working tree contiene cambios sin commitear (backup en
UI, tags v2) y deuda heredada: `dist-electron/` versionado, docs desactualizadas
(mencionan un editor markdown que ya no existe), `.npmrc` sin trackear.

La decisión de producto es evolucionar ese código —no reescribirlo— añadiendo
nube, jerarquía de épicas y gamificación.

## Decisión

- Copiar el **working tree** de TodoDex (no su historia git) a `apps/desktop/`
  en la fase `/desktop`.
- Renombrar a SisyFlow:
  - `package.json`: `name` → `sisyflow-desktop`.
  - `electron-builder.json5`: `appId` → `com.sisyflow.app`, `productName` → `SisyFlow`.
  - `index.html` y título de ventana → SisyFlow.
- No copiar: `node_modules/`, `dist/`, `dist-electron/`, `release/`, `.git/`
  y `docs/` del origen (el contenido útil se migra al vault).
- Incluir en la copia: `.npmrc` (con `node-linker=hoisted`) y corregir la deuda
  (no versionar `dist-electron/`, docs nuevas viven en el vault).
- **Preservar la paridad funcional completa** ([[Paridad funcional con TodoDex]]):
  todos y editor de contenido no pierden ninguna capacidad existente.

## Consecuencias

### Positivas

- Punto de partida validado y funcional; la inversión se concentra en lo nuevo.
- La deuda conocida se corrige en la copia, no se arrastra.
- El renombre temprano evita deuda de naming en instaladores y rutas de datos.

### Negativas / Trade-offs

- Se hereda el diseño del proyecto base (sin store global, patrón `load()` tras
  mutación), que deberá evolucionar a UI optimista ([[ADR-008 Estrategia de datos nube-first]]).
- La copia manual (sin historia git) pierde la trazabilidad de commits originales;
  se mitiga con la documentación del vault.

### Neutrales

- La estética pastel "Nintendo OS" y la paleta de colores se mantienen.
- Los datos de usuario de TodoDex (IndexedDB) no viajan en la copia: la migración
  real ocurre vía el script Sísifo (US 1.2).

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-001 Eleccion de stack]], [[ADR-007 Jerarquia Epicas Proyectos Tareas]], [[ADR-008 Estrategia de datos nube-first]]
- **Afecta a:** [[App de escritorio (base TodoDex)]], [[Paridad funcional con TodoDex]], [[Editor de contenido (BlockNote)]], [[Builds de escritorio (Windows)]]
- **Repo:** `apps/desktop/`
