---
tags: [adr, decision, realtime, supabase, arquitectura]
status: Aceptado
date: 2026-09-26
---

# ADR-016 Realtime con Supabase

## Status

Aceptado — implementado el 2026-09-26 en backend, desktop y móvil. Verificado en
local (`supabase db reset` limpio, suite pgTAP con 71 aserciones en verde y E2E
de Realtime con `supabase-js`: INSERT/DELETE propagados y aislamiento RLS entre
usuarios). Aplicado también al Supabase de producción con `supabase db push` el
2026-09-26. Pendiente: E2E manual con los dos clientes ([[Capa de datos Supabase]]).

## Contexto

La app de escritorio y la móvil ([[ADR-015 App movil Flutter (Android)]]) usan la
misma cuenta y el mismo backend Supabase ([[ADR-005 Supabase como backend]],
[[ADR-008 Estrategia de datos nube-first]]). Hasta ahora, cada cliente solo
releía tras sus propias mutaciones o al refrescar manualmente: un cambio hecho en
un dispositivo no se reflejaba en el otro sin recargar. Se quiere propagar en
vivo los cambios de `epics`, `projects`, `todos`, `tags` y `todo_completions`.

Restricciones: un usuario por cuenta (sin colaboración multi-usuario), volumen
bajo, RLS como frontera de seguridad, y no exponer `service_role`.

## Decisión

1. **Postgres Changes (WAL)** sobre la publicación `supabase_realtime`, en vez de
   Broadcast-from-Database. Es lo más simple (cero triggers) y suficiente a esta
   escala; si algún día se superan ~3000 suscriptores concurrentes, se migrará a
   *Broadcast to stream database changes*.
2. **Migración** `20260926120000_realtime.sql`: agrega las 5 tablas a
   `supabase_realtime` y les pone `replica identity full`. Sin `replica identity
   full` no llega el `old_record` en UPDATE/DELETE y, sobre todo, no se pueden
   filtrar los DELETE.
3. **Seguridad**: la documentación de Supabase confirma que **la RLS no se aplica
   a DELETE** (no hay fila que verificar). Por eso los clientes filtran SIEMPRE
   por `user_id=eq.<uid>` (con `replica identity full` el `old_record` incluye
   `user_id`), además de la RLS que ya filtra SELECT/INSERT/UPDATE.
4. **Micro-suscripciones con bus ref-counteado**: un único canal por usuario
   (`sisyflow:db:<uid>`) que solo mantiene los bindings (tabla) que alguna vista
   necesita. Al montar/desmontar vistas, el set de tablas se recalcula (debounce)
   y el canal se reconstruye. Así no hay suscripciones duplicadas (varias vistas
   leen `todos` a la vez) ni eventos vivos cuando la vista no los usa.
5. **Actualización de vistas**: *reload* debounced (~250 ms) de la consulta que
   alimenta la vista; idempotente y consistente con la UI optimista. En
   reconexión, al pasar a `SUBSCRIBED`, el bus dispara un *resync* que fuerza el
   refetch para recuperar lo perdido mientras estuvo desconectado.
6. **Ciclo de vida**: el bus arranca al autenticarse y se detiene/limpia al
   cerrar sesión; cada suscripción de vista se cancela en `unmount` (desktop
   `useRealtimeRefresh`) o `dispose` (móvil `ViewModel`). Los `ViewModel` del
   móvil usan un **refresh silencioso** (sin spinner) para no parpadear en cada
   evento.

### Implementación

- **Desktop** (`apps/desktop/src/realtime/`): `bus.ts` (canal + ref-counting +
  resync) y `useRealtimeRefresh.ts` (suscripción de vista con debounce). El bus se
  arranca desde `AuthProvider`. Los hooks se suscriben a lo que leen.
- **Mobile** (`apps/mobile/lib/core/realtime.dart`): `RealtimeBus` con
  `watch`/`watchRefresh`; se provee en `app.dart` y se arranca desde
  `AuthViewModel`.

### Inventario de eventos

Todas con `event: '*'` y filtro `user_id=eq.<uid>`:

| Tabla | Desktop (hook) | Mobile (ViewModel) |
| --- | --- | --- |
| `projects` | `useProjects` | `HomeViewModel`, `EpicsViewModel`, `ProjectViewModel` |
| `epics` | `useEpics` | `HomeViewModel`, `EpicsViewModel` |
| `todos` | `useProjects` (conteos), `useProjectTodos`, `useDayTodos`, `useGamification`, `useSearchTodos` | `HomeViewModel`, `ProjectViewModel`, `SearchViewModel` |
| `tags` | `useProjectTags` | `ProjectViewModel` |
| `todo_completions` | `useTodoCompletions`, `useGamification` | `HomeViewModel`, `ProjectViewModel` |

## Consecuencias

### Positivas

- Un cambio en un dispositivo se refleja en el otro casi en vivo, sin recargar.
- Cero cambios de esquema funcional: solo publicación + `replica identity full`.
- Micro-suscripciones: sin bindings ni eventos innecesarios; un solo canal por
  usuario.

### Negativas / Trade-offs

- `replica identity full` aumenta el WAL en updates (aceptable a esta escala).
- El *reload* es simple pero re-consulta vistas ante eventos que quizá no las
  afectan (se filtra por `user_id`, no por proyecto); el debounce lo amortigua.
- Durante una desconexión no se reproducen eventos; se reconcilia con el resync.
- El filtrado de DELETE depende de `replica identity full`: si una tabla nueva se
  agrega a Realtime sin esa opción, los DELETE no se podrán filtrar por usuario.

### Neutrales

- No se usan canales privados ni políticas en `realtime.messages` (eso es para
  Broadcast/Presence). Postgres Changes usa las políticas RLS de las tablas.
- El CLI ([[CLI de SisyFlow]]) queda fuera de Realtime.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-005 Supabase como backend]], [[ADR-008 Estrategia de datos nube-first]], [[ADR-015 App movil Flutter (Android)]], [[ADR-011 Gamificacion zona horaria rachas y heatmap]]
- **Afecta a:** [[Capa de datos Supabase]], [[App de escritorio (base TodoDex)]], [[App móvil (Flutter)]], [[Modelo de datos objetivo (Supabase)]]
- **Repo:** `backend/supabase/`, `apps/desktop/src/realtime/`, `apps/mobile/lib/core/realtime.dart`
