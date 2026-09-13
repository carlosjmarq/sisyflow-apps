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

## Contenido

### Tareas (todos)

- [ ] Crear, editar y eliminar tareas dentro de un proyecto.
- [ ] Título de la tarea.
- [ ] Estado: `backlog`, `todo`, `in-progress`, `done`, `cancelled`.
- [ ] Prioridad y urgencia: `low`, `medium`, `high`, `critical`.
- [ ] Fecha de vencimiento (`expirationDate`, opcional).
- [ ] Contenido enriquecido por tarea (editor BlockNote, ver más abajo).
- [ ] Vista por secciones: Pendientes / Completados / Cancelados.
- [ ] Ordenamiento configurable y filtros por estado, prioridad y épica.
- [ ] Drawer de detalle redimensionable (mín. 360 px, por defecto 520 px, máx. 90vw;
      ancho persistido en `localStorage`, clave `tododex.drawerWidth`).

### Proyectos

- [ ] CRUD de proyectos con nombre y color (paleta pastel: `mint`, `coral`,
      `lavender`, `peach`, `sky`, `butter`).
- [ ] Orden por fecha de creación o alfabético.
- [ ] Borrado en cascada de tareas, épicas y tags del proyecto.
- [ ] Home con grid responsive (1–4 columnas) y tarjetas de proyecto.

### Épicas (modelo actual, se transforma)

- [ ] CRUD de épicas por proyecto (`useProjectEpics`, upsert por nombre).
- [ ] Los datos existentes se migran a Épicas top-level en la fase `/hierarchy`
      ([[ADR-007 Jerarquia Epicas Proyectos Tareas]]); el dato no se pierde.

### Tags y búsqueda (capacidad sin UI)

- [ ] CRUD de tags por proyecto (`useProjectTags`) — existe en la capa de datos,
      sin uso en la UI actual. Se conserva la capacidad.
- [ ] Búsqueda de tareas por título con debounce (`useSearchTodos`) — existe en
      la capa de datos, sin uso en la UI actual. Se conserva la capacidad.

### Backup

- [ ] Export de backup JSON (proyectos, tareas, épicas, tags) descargable.
- [ ] Import de backup JSON con validación y reemplazo transaccional.

### Editor de contenido

- [ ] Edición enriquecida con BlockNote en el detalle de cada tarea
      ([[Editor de contenido (BlockNote)]]).
- [ ] Contenido guardado como JSON de bloques (`contentFormat: 'blocknote'`).
- [ ] Tareas nuevas con contenido vacío válido (`'[]'`).
- [ ] Conversión de contenido markdown legacy a bloques (función con `marked`).

### Look & feel

- [ ] Estética pastel "Nintendo OS", tipografía M PLUS Rounded 1c,
      colores de proyecto y sombras suaves.
- [ ] Tooltip que solo aparece cuando el texto está truncado.
- [ ] Diálogos de confirmación para acciones destructivas.

### Verificación

- [ ] Inventario contrastado contra el código real al copiar (fase `/desktop`).
- [ ] Checklist de regresión ejecutada al cerrar `/cloud`, `/hierarchy` y `/gamification`.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[App de escritorio (base TodoDex)]], [[Editor de contenido (BlockNote)]], [[Modelo de datos objetivo (Supabase)]]
- **ADR:** [[ADR-004 Base de escritorio TodoDex a SisyFlow]], [[ADR-007 Jerarquia Epicas Proyectos Tareas]], [[ADR-008 Estrategia de datos nube-first]]
- **Ruta en el monorepo:** `apps/desktop/`
