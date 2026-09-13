---
tags: [adr, decision, datos, supabase]
status: Aceptado
date: 2026-09-13
---

# ADR-008 Estrategia de datos nube-first

## Status

Aceptado (decisión confirmada el 2026-09-13)

## Contexto

Hoy la app es 100% offline: Dexie/IndexedDB es la fuente de verdad y cada
mutación recarga los datos desde la base local (`load()` tras mutar), sin UI
optimista. Las US 1.2–1.3 piden volcar los datos existentes a Supabase y operar
contra la nube sin perder la sensación de fluidez.

Alternativas evaluadas:

1. **Nube-first con UI optimista** (elegida): Supabase es la única fuente de
   verdad; la UI anticipa el resultado y revierte si la red falla.
2. **Local-first con sync bidireccional** Dexie ↔ Supabase (descartada):
   funciona offline, pero exige resolver conflictos, merge y dos fuentes de
   verdad; complejidad desproporcionada para una app personal.

## Decisión

- **Supabase es la fuente de verdad.** Toda lectura y escritura operativa pasa
  por el cliente de Supabase.
- **Dexie/IndexedDB queda solo como origen de la migración Sísifo (US 1.2):**
  se lee una única vez, se mapea al esquema relacional y se sube con batch
  upsert. No se usa como store operativo.
- **UI optimista (US 1.3):** las mutaciones actualizan la UI de inmediato; si la
  red falla, la UI revierte el cambio y muestra una notificación de error.
- La caché de lectura en memoria es admisible para fluidez, pero no persistente
  ni fuente de verdad (decisión de detalle en `/cloud`).
- La vista SQL `daily_epic_logs` (US 3.1) se calcula en Postgres, no en el cliente.

## Consecuencias

### Positivas

- Una sola fuente de verdad: sin conflictos ni merge.
- La gamificación se calcula con SQL eficiente (vista + índices).
- La migración es un proceso de una sola vez, acotado y verificable.

### Negativas / Trade-offs

- **La app requiere conexión para operar.** Sin red, las lecturas fallan y las
  mutaciones revierten: el modo offline solo muestra errores controlados.
- Si la latencia es alta, las lecturas pueden sentirse lentas; se mitiga con
  UI optimista en escrituras y caché en memoria si hiciera falta.
- Se abandona el patrón offline-first que caracterizaba a TodoDex.

### Neutrales

- El backup/export JSON local existente puede conservarse como utilidad de
  respaldo manual, pero deja de ser la vía de persistencia principal.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-005 Supabase como backend]], [[ADR-007 Jerarquia Epicas Proyectos Tareas]]
- **Afecta a:** [[Backend Supabase]], [[Modelo de datos objetivo (Supabase)]], [[Paridad funcional con TodoDex]]
- **Repo:** `apps/desktop/src/` (capa de datos), `backend/supabase/`
