---
tags: [adr, decision, migracion, datos]
status: Propuesto
date: 2026-09-13
---

# ADR-009 Migración Sísifo: mapeo y marcador

## Status

Aceptado — implementado y verificado en la Fase 3 (2026-09-13).

## Contexto

US 1.2 pide volcar los datos locales de IndexedDB (Dexie) a Supabase una sola
vez, sin perder historial. La estrategia nube-first está en
[[ADR-008 Estrategia de datos nube-first]] y la jerarquía destino en
[[ADR-007 Jerarquia Epicas Proyectos Tareas]]. Los modelos no coinciden 1:1:

- IDs numéricos auto-incrementales → UUID.
- Épicas por proyecto (varias, texto libre) → Épicas top-level (una por proyecto).
- `todos.epic` (texto) → sin equivalente: la épica se deriva del proyecto.
- Los todos locales no tienen `completed_at` (solo `status = 'done'`).
- `content` es string (JSON de BlockNote o markdown legacy) → `jsonb`.
- El import de backups antiguos (versión 2) arrastra los mismos problemas.

## Decisión

1. **Migración en el cliente**: el renderer lee Dexie y escribe con
   `@supabase/supabase-js` (RLS activa, `user_id` de la sesión). Pantalla
   Settings con confirmación, progreso y resultado. **Dexie no se borra.**
2. **Épicas**: deduplicar por nombre normalizado (trim, minúsculas) → Épicas
   top-level con color asignado. Cada proyecto se asigna a su épica **más
   antigua** (menor id local). Proyectos sin épica → épica **"General"**
   (se crea si no existe). Las ambigüedades se reportan en el resultado.
3. **`completed_at`**: `updatedAt` cuando `status = 'done'` (fallback
   `createdAt`); en el resto de estados queda nulo.
4. **Contenido**: JSON válido de bloques → `jsonb` tal cual; si no,
   markdown → bloques BlockNote con `marked` + `tryParseHTMLToBlocks`
   (`content_format = 'blocknote'`).
5. **Idempotencia**: UUID deterministas derivados del id local (`stableUuid`) y
   `upsert` con `ignoreDuplicates` hacen la migración reintentable sin duplicar
   datos. Además, un marcador `sisyflow.sisifo.migratedAt` en `localStorage`
   bloquea la re-ejecución en la UI (limpiarlo y reintentar es seguro).
6. **Backups**: el export pasa a versión 3 con UUIDs; el import acepta v2
   (aplica este mismo mapeo) y v3 (inserción directa).

## Consecuencias

### Positivas

- Transición sin pérdida de datos con reporte de ambigüedades.
- El mismo mapeo sirve para migración y para importar backups antiguos.
- Dexie intacto: la verificación y un eventual reintento son posibles.

### Negativas / Trade-offs

- No hay rollback automático: revertir una migración requiere borrar los
  registros migrados (los ids deterministas permiten reintentar sin duplicar).
- `todos.epic` se retira: si un todo apuntaba a una épica distinta a la elegida
  para su proyecto, esa asignación individual se pierde (queda en el reporte).

### Neutrales

- "General" es de facto un nombre reservado para el fallback.
- El color de las épicas migradas se asigna por orden de paleta.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-007 Jerarquia Epicas Proyectos Tareas]], [[ADR-008 Estrategia de datos nube-first]], [[US's for personal development project]]
- **Afecta a:** [[Capa de datos Supabase]], [[Modelo de datos objetivo (Supabase)]], [[Paridad funcional con TodoDex]]
- **Repo:** `apps/desktop/src/migration/`, `apps/desktop/src/db/backup.ts`
