---
tags: [tecnico, editor, blocknote, paridad]
status: borrador
date: 2026-09-13
---

# Editor de contenido (BlockNote)

## Contexto

El editor de contenido de las tareas es parte del guardrail de paridad
([[Paridad funcional con TodoDex]]): debe conservarse tal cual al migrar a
SisyFlow. Esta nota documenta su estado actual y su proyección a Supabase.

## Contenido

### Estado actual (TodoDex)

- **BlockNote + Mantine 8** (`@blocknote/core`, `@blocknote/react`,
  `@blocknote/mantine`). No hay editor markdown de terceros: los docs del repo
  origen quedaron desactualizados (`@uiw/react-md-editor` ya no existe).
- Componente `BlockEditor.tsx`:
  - `useCreateBlockNote` para instanciar el editor.
  - `useEditorChange` para notificar cambios al formulario/drawer.
  - `marked` para convertir contenido **markdown legacy** a bloques BlockNote.
- Persistencia por tarea:
  - `content`: JSON serializado de bloques.
  - `contentFormat`: `'blocknote'`; el valor legacy `'markdown'` se convierte al abrir.
  - Tareas nuevas se crean con `content: '[]'` y `contentFormat: 'blocknote'`.
- El editor vive en el drawer/formulario de tarea (`TodoForm`, `TodoDrawer`).

### Proyección a Supabase (implementada en Fase 3)

- `todos.content` es `jsonb` y `content_format` es `text` con default
  `'blocknote'`; los mappers convierten string ↔ jsonb
  ([[Capa de datos Supabase]]).
- La migración Sísifo convierte registros legacy (`contentFormat: 'markdown'`)
  a bloques con `marked` + `tryParseHTMLToBlocks` antes del upsert.
- El guardado del contenido usa debounce de 800 ms; se fuerza al cerrar el drawer.
- El contenido no se transforma a otro formato: BlockNote sigue siendo el editor.

### Requisitos de conservación

- Crear, editar y leer contenido enriquecido por tarea sin pérdida de bloques.
- Manejar contenido vacío (`'[]'`) y contenido legacy sin romper la UI.
- Mantener el render de solo lectura donde hoy existe (si aplica en el drawer).

## Pendientes

- [x] Verificar el inventario contra el código real al copiar (Fase 1, 2026-09-13).
- [ ] Confirmar el tamaño típico de `content` para decidir límites de payload.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Paridad funcional con TodoDex]], [[App de escritorio (base TodoDex)]], [[Modelo de datos objetivo (Supabase)]]
- **ADR:** [[ADR-001 Eleccion de stack]], [[ADR-004 Base de escritorio TodoDex a SisyFlow]]
- **Ruta en el monorepo:** `apps/desktop/src/components/BlockEditor.tsx`
