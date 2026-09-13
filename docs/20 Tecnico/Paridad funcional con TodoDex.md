---
tags: [tecnico, paridad, guardrail]
status: borrador
date: 2026-09-13
---

# Paridad funcional con TodoDex

## Contexto

SisyFlow evoluciona la app TodoDex ([[App de escritorio (base TodoDex)]]) sin
reescribirla: la migración a nube, la jerarquía de épicas y la gamificación se
suman **sin perder ninguna funcionalidad actual**. Esta nota es el **guardrail
de paridad**: inventario congelado de lo que debe seguir funcionando, verificado
en cada fase.

> Regla: ninguna fase puede romper un ítem de este inventario sin un ADR que lo
> superseda explícitamente (ver `AGENTS.md` raíz).
>
> **Estado:** inventario verificado contra el código en la Fase 1 (2026-09-13).
> Re-verificar al cerrar las fases `/cloud`, `/hierarchy` y `/gamification`.

## Contenido

### Tareas (todos)

- [x] Crear, editar y eliminar tareas dentro de un proyecto.
- [x] Título de la tarea.
- [x] Estado: `backlog`, `todo`, `in-progress`, `done`, `cancelled`.
- [x] Prioridad y urgencia: `low`, `medium`, `high`, `critical`.
- [x] Fecha de vencimiento (`expirationDate`, opcional).
- [x] Contenido enriquecido por tarea (editor BlockNote, ver más abajo).
- [x] Vista por secciones: Pendientes / Completados / Cancelados.
- [x] Ordenamiento configurable y filtros por estado, prioridad y épica.
- [x] Drawer de detalle redimensionable (mín. 360 px, por defecto 520 px, máx. 90vw;
      ancho persistido en `localStorage`, clave `tododex.drawerWidth`).

### Proyectos

- [x] CRUD de proyectos con nombre y color (paleta pastel: `mint`, `coral`,
      `lavender`, `peach`, `sky`, `butter`).
- [x] Orden por fecha de creación o alfabético.
- [x] Borrado en cascada de tareas, épicas y tags del proyecto.
- [x] Home con grid responsive (1–4 columnas) y tarjetas de proyecto.

### Épicas (modelo actual, se transforma)

- [x] CRUD de épicas por proyecto (`useProjectEpics`, upsert por nombre).
- [x] Los datos existentes se migran a Épicas top-level en la fase `/hierarchy`
      ([[ADR-007 Jerarquia Epicas Proyectos Tareas]]); el dato no se pierde.

### Tags y búsqueda (capacidad sin UI)

- [x] CRUD de tags por proyecto (`useProjectTags`) — existe en la capa de datos,
      sin uso en la UI actual. Se conserva la capacidad.
- [x] Búsqueda de tareas por título con debounce (`useSearchTodos`) — existe en
      la capa de datos, sin uso en la UI actual. Se conserva la capacidad.

### Backup

- [x] Export de backup JSON (proyectos, tareas, épicas, tags) descargable.
- [x] Import de backup JSON con validación y reemplazo transaccional.

### Editor de contenido

- [x] Edición enriquecida con BlockNote en el detalle de cada tarea
      ([[Editor de contenido (BlockNote)]]).
- [x] Contenido guardado como JSON de bloques (`contentFormat: 'blocknote'`).
- [x] Tareas nuevas con contenido vacío válido (`'[]'`).
- [x] Conversión de contenido markdown legacy a bloques (función con `marked`).

### Look & feel

- [x] Estética pastel "Nintendo OS", tipografía M PLUS Rounded 1c,
      colores de proyecto y sombras suaves.
- [x] Tooltip que solo aparece cuando el texto está truncado.
- [x] Diálogos de confirmación para acciones destructivas.

### Verificación

- [x] Inventario contrastado contra el código real al copiar (Fase 1, 2026-09-13).
- [ ] Checklist de regresión ejecutada al cerrar `/cloud`, `/hierarchy` y `/gamification`.

### Hallazgos de la verificación (Fase 1)

- La tabla `tags` tiene además `color?: TagColor` (opcional) — agregado a
  [[Modelo de datos objetivo (Supabase)]] como `color_code` nullable.
- La base Dexie mantiene el nombre `TodoDexDB` a propósito: la migración Sísifo
  debe poder leer los datos existentes de los usuarios de TodoDex.
- La clave de `localStorage` del ancho del drawer sigue siendo
  `tododex.drawerWidth` (interna, sin impacto visible).
- El archivo de backup exportado ahora se llama `sisyflow-backup-<fecha>.json`
  (renombre de marca; la estructura del JSON no cambió).
- Se copió el working tree del origen, incluidos los cambios sin commitear
  (backup en la UI de Home y `tags` incluidos en el backup).

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[App de escritorio (base TodoDex)]], [[Editor de contenido (BlockNote)]], [[Modelo de datos objetivo (Supabase)]]
- **ADR:** [[ADR-004 Base de escritorio TodoDex a SisyFlow]], [[ADR-007 Jerarquia Epicas Proyectos Tareas]], [[ADR-008 Estrategia de datos nube-first]]
- **Ruta en el monorepo:** `apps/desktop/`
