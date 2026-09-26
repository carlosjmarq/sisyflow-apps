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

### Tags y búsqueda

- [x] CRUD de tags por proyecto (`useProjectTags`) — expuesto en la UI: chips y
      gestor de tags en la pantalla de proyecto. Sin cambios de esquema (los tags
      son por proyecto); ver [[ADR-012 Rediseno UI Material Design 3]].
- [x] Búsqueda de tareas por título con debounce (`useSearchTodos`) — expuesta en
      la UI: búsqueda global en el top app bar que navega al proyecto y abre el
      drawer de la tarea ([[ADR-012 Rediseno UI Material Design 3]]).

### Backup

- [x] Export de backup JSON (proyectos, tareas, épicas, tags) descargable.
- [x] Import de backup JSON con validación y reemplazo transaccional.

### Editor de contenido

- [x] Edición enriquecida con BlockNote en el detalle de cada tarea
      ([[Editor de contenido (BlockNote)]]).
- [x] Contenido guardado como JSON de bloques (`contentFormat: 'blocknote'`).
- [x] Tareas nuevas con contenido vacío válido (`'[]'`).
- [x] Conversión de contenido markdown legacy a bloques (función con `marked`).

### Tareas recurrentes (nuevo, US 4.1)

- [x] Periodicidad por tarea (`none`, `daily`, `weekdays`, `weekly`, `monthly`) y
      registro de completados repetidos con historial
      ([[ADR-014 Tareas recurrentes]]).
- [x] Completar desde el proyecto y desde «Tareas del día»; contador del período,
      deshacer y borrado de completados en el detalle.
- [x] Las tareas sin recurrencia conservan el flujo actual (`status = done` +
      `completed_at`), sin regresiones.

### App móvil (Flutter, US 5.1)

- [x] Paridad funcional en Android sobre el mismo backend ([[App móvil (Flutter)]],
      [[ADR-015 App movil Flutter (Android)]]): auth, jerarquía, recurrentes,
      gamificación, etiquetas, búsqueda y backup.
- [x] Editor con los bloques BlockNote soportados (párrafos, encabezados 1–3,
      listas, cita, código y separador); los tipos exóticos degradan a texto.
- [ ] E2E manual en dispositivo/emulador y deep link de confirmación
      (pendiente).

### Look & feel

- [x] Estética Material Design 3 (tokens MD3, light/dark con toggle, iconos
      Material Symbols Rounded, tipografía M PLUS Rounded 1c en escala MD3,
      state layers y animaciones MD3). Supersede la estética pastel "Nintendo OS"
      ([[ADR-012 Rediseno UI Material Design 3]]).
- [x] Tooltip que solo aparece cuando el texto está truncado.
- [x] Diálogos de confirmación para acciones destructivas.

### Verificación

- [x] Inventario contrastado contra el código real al copiar (Fase 1, 2026-09-13).
- [x] Regresión de la Fase 3 (`/cloud`, 2026-09-13): lint, typecheck y build
      verdes; 16 comprobaciones de integración (auth, RLS, trigger, upsert);
      verificación E2E de UI completa (login, CRUD, editor, migración, RLS);
      backup v3 y migración Sísifo implementados.
- [x] Regresión de la Fase 4 (`/hierarchy`, 2026-09-13): 27 tests pgTAP,
      lint/typecheck/build verdes y E2E completo (CRUD de épicas, estados de
      proyecto, agrupación por épica, Tareas del día, bloqueo de borrado).
- [x] Regresión de la Fase 5 (`/gamification`, 2026-09-13): 38 tests pgTAP,
      lint/typecheck/build verdes y E2E completo (heatmap de 365 días, filtro
      global/por épica, racha en vivo +1 y reglas de fin de semana cubiertas
      por tests).
- [x] Regresión del rediseño UI Material Design 3 ([[ADR-012 Rediseno UI Material Design 3]],
      2026-09-13): lint, typecheck y build verdes; 47 tests pgTAP (38 previos +
      9 de racha global); E2E manual en light y dark (login, dashboard con racha
      reactiva al completar una tarea, heatmap compacto/expandido, búsqueda con
      deep-link al drawer de la tarea, tags y migración Sísifo).
- [x] Regresión de tareas recurrentes ([[ADR-014 Tareas recurrentes]],
      2026-09-20): 61 tests pgTAP (12 nuevos de recurrencia), lint y typecheck
      verdes en desktop y CLI; smoke test del CLI (create/check/update/list) y
      E2E de UI (crear recurrente, completar ×2 desde Inicio con heatmap
      reactivo, deshacer, historial con borrado, conversión de tarea completada
      a recurrente y tareas de una vez sin cambios).
- [x] Verificación de la app móvil (2026-09-20): `flutter analyze` y
      `dart format` verdes, 13 tests unitarios (mappers, recurrencia y adaptador
      BlockNote) y `flutter build apk --debug` compila; E2E en dispositivo
      pendiente.

### Hallazgos de la Fase 5

- El corte del día y las rachas se calculan en SQL con la zona horaria del
  cliente; `daily_epic_logs` (UTC) queda como vista de referencia.
- Pantalla `/progress` con heatmap propio (sin dependencias) y tarjetas de racha
  ordenadas por racha actual.
- Fix heredado: `DialogOverlay` y `DialogContent` ahora usan `forwardRef`; se
  eliminó el warning de React al abrir diálogos.

### Hallazgos de la Fase 4

- Home agrupa las tarjetas por épica y agrega el toggle "Tareas del día" con las
  tareas pendientes de proyectos activos (los pausados/completados no aportan).
- El estado del proyecto se edita en el formulario (Activo/Pausado/Completado) y
  se muestra como badge; los proyectos inactivos se atenúan.
- El borrado de épicas con proyectos está bloqueado (FK `on delete restrict`,
  [[ADR-010 Ciclo de vida de proyectos y vista del dia]]).
- `completed_at` es visible en el drawer ("Completado el …").

### Hallazgos de la Fase 3

- La épica por tarea y su filtro se retiraron: la épica pasa a ser del proyecto
  ([[ADR-007 Jerarquia Epicas Proyectos Tareas]]). El indicador de épica sigue
  visible en tarjetas, lista y drawer.
- El color de proyecto migra de nombre de paleta a hex (`color_code`).
- El contenido del editor se guarda con debounce de 800 ms para no saturar la
  red ([[Capa de datos Supabase]]).
- El backup pasa a versión 3 (UUIDs); el import acepta v2 y v3.

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
