---
name: sisyflow-db
description: Guía para trabajar con la capa de datos de SisyFlow. Estado actual Dexie.js + IndexedDB (origen de migración) y destino Supabase. Úsala cuando se hable de base de datos, Dexie, IndexedDB, esquema, tablas, hooks de datos, índices, migraciones, migración Sísifo, o de agregar/quitar/modificar campos, tablas, consultas u operaciones de persistencia. Actívala ante cualquier tarea de guardar, consultar o estructurar datos.
---

# SisyFlow Database Skill

Eres el experto en la capa de datos de SisyFlow (`apps/desktop/src/`).

Dos contextos conviven:

1. **Dexie/IndexedDB** — implementación actual (heredada de TodoDex). Sigue siendo
   la única capa operativa hasta la fase `/cloud`.
2. **Supabase** — destino ([[ADR-008 Estrategia de datos nube-first]]): fuente de
   verdad final; Dexie queda solo como **origen de la migración Sísifo (US 1.2)**.
   Para trabajo de Supabase carga además la skill `supabase`.

Los componentes **nunca** importan `db` directamente: siempre pasan por los hooks.

## Esquema Dexie actual (versión 4)

### Tabla `projects`

| Campo | Tipo | Índice |
| --- | --- | --- |
| id | `++` auto-increment (PK) | — |
| name | `string` | `name` |
| color | `string` (mint, coral, lavender, peach, sky, butter) | — |
| createdAt | `Date` | `createdAt` |

### Tabla `todos`

| Campo | Tipo | Índice |
| --- | --- | --- |
| id | `++` auto-increment (PK) | — |
| projectId | `number` (FK → projects) | `projectId` |
| title | `string` | — |
| status | `TodoStatus` (backlog, todo, in-progress, done, cancelled) | `status` |
| priority | `Priority` (low, medium, high, critical) | `priority` |
| urgency | `Urgency` (low, medium, high, critical) | `urgency` |
| epic | `string` (texto libre; se migra a épica top-level) | — |
| content | `string` (JSON de bloques BlockNote o markdown legacy) | — |
| contentFormat | `'markdown' \| 'blocknote'` (opcional) | — |
| createdAt | `Date` | `createdAt` |
| updatedAt | `Date` | `updatedAt` |
| expirationDate | `Date \| null` | `expirationDate` |

### Tabla `epics`

| Campo | Tipo | Índice |
| --- | --- | --- |
| id | `++` auto-increment (PK) | — |
| projectId | `number` (FK → projects) | `projectId` |
| name | `string` | `name` |

### Tabla `tags`

| Campo | Tipo | Índice |
| --- | --- | --- |
| id | `++` auto-increment (PK) | — |
| projectId | `number` (FK → projects) | `projectId` |
| name | `string` | `name` |

### Ubicación de archivos

```
apps/desktop/src/db/database.ts   → clase TodoDatabase (Dexie), exporta singleton db
apps/desktop/src/types/index.ts   → interfaces, type aliases, labels y constantes
apps/desktop/src/hooks/useProjects.ts → useProjects, useProjectTodos, useProjectEpics, useProjectTags, useSearchTodos
apps/desktop/src/db/backup.ts     → exportBackup / importBackup (JSON, versión 2)
```

## Modificar el esquema Dexie

### Agregar una tabla nueva

1. **Define la interfaz** en `src/types/index.ts`. El `id` es `id?: number` (Dexie
   lo completa). Si la tabla referencia `projects`, incluye `projectId: number`.
2. **Agrega la tabla al esquema** en `src/db/database.ts`:
   - Declara la propiedad en la clase: `nuevaTabla!: Table<NuevoTipo, number>`.
   - Agrégala en `this.version(N+1).stores({...})` **incrementando la versión**.
     Sintaxis de índices: `'++id, campoIndexado1, campoIndexado2'`.
   - Si necesitas migrar datos, usa `.upgrade(tx => {...})`.
   - **Regla:** nunca modifiques una versión existente. Crea una nueva entrada
     `this.version(N)` que declare **todas** las tablas completas (las viejas +
     las nuevas). Dexie crea solo lo que falta.
3. **Crea el hook** siguiendo el patrón de abajo.
4. **Actualiza el backup** en `src/db/backup.ts` si la tabla debe incluirse.

### Agregar un campo o un índice

- Campo: agrégalo a la interfaz (opcional si es nullable) e incrementa la versión
  redeclarando la tabla completa. Sin migración si es opcional.
- Índice: incrementa la versión y agrega el campo a la lista de índices; Dexie
  construye el índice sobre los datos existentes.

## Crear hooks de datos

### Patrón base (template mínimo: `useProjectEpics`)

```ts
import { useCallback, useEffect, useState } from 'react'
import type { NuevoTipo } from '../types'
import { db } from '../db/database'

export function useNuevoHook(projectId: number | undefined) {
  const [items, setItems] = useState<NuevoTipo[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (projectId == null) {       // guard clause obligatorio
      setItems([])
      setLoading(false)
      return
    }
    const data = await db.nuevaTabla
      .where('projectId')
      .equals(projectId)
      .toArray()                   // o .sortBy('campo')
    setItems(data)
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (item: Omit<NuevoTipo, 'id'>) => {
    const id = await db.nuevaTabla.add(item as NuevoTipo)
    await load()                   // re-fetch completo tras mutar
    return id
  }, [load])

  const update = useCallback(async (id: number, updates: Partial<NuevoTipo>) => {
    await db.nuevaTabla.update(id, updates)
    await load()
  }, [load])

  const remove = useCallback(async (id: number) => {
    await db.nuevaTabla.delete(id)
    await load()
  }, [load])

  return { items, loading, create, update, remove, reload: load }
}
```

### Principios

- **Guard clause**: verifica `if (projectId == null)` antes de consultar (evita
  errores en el primer render antes de que el router resuelva el parámetro).
- **Re-fetch post-mutación** en Dexie (patrón actual). En Supabase aplica UI
  optimista con reversión ([[ADR-008 Estrategia de datos nube-first]]).
- **Tipos**: creación con `Omit<Tipo, 'id'>`; updates con `Partial<Tipo>`.
- **useCallback + useEffect** con las dependencias correctas.

### Operaciones comunes de Dexie

| Necesidad | Código |
| --- | --- |
| Todos los registros ordenados | `db.table.orderBy('campo').reverse().toArray()` |
| Filtrar por índice exacto | `db.table.where('campo').equals(valor).toArray()` |
| Filtrar por índice compuesto | `db.table.where({ campo1: val1, campo2: val2 }).first()` |
| Filtrar con rango | `db.table.where('campo').between(lo, hi).toArray()` |
| Ordenar por índice | `db.table.where('projId').equals(id).sortBy('name')` |
| Contar | `db.table.where('campo').equals(val).count()` |
| Eliminar filtrado | `db.table.where('campo').equals(val).delete()` |
| Bulk insert | `db.table.bulkAdd([...])` |
| Bulk update | `db.table.where('campo').equals(val).modify({ campo: nuevoValor })` |
| Transacción multi-tabla | `db.transaction('rw', db.t1, db.t2, async () => { ... })` |

### Eliminación en cascada

Al borrar un registro padre, borra primero los hijos:

```ts
await db.todos.where('projectId').equals(id).delete()
await db.epics.where('projectId').equals(id).delete()
await db.tags.where('projectId').equals(id).delete()
await db.projects.delete(id)
```

Si hay +3 operaciones atómicas, envuélvelas en `db.transaction('rw', ...)`.

## Migración Sísifo (US 1.2, fase `/cloud`)

- Leer Dexie una sola vez y mapear al esquema Supabase
  ([[Modelo de datos objetivo (Supabase)]]): `id` numérico → `uuid` (tabla de
  correlación en memoria), fechas → `timestamptz`, `completed_at` derivado de
  `status = 'done'`, épicas por proyecto → épicas top-level deduplicadas
  ([[ADR-007 Jerarquia Epicas Proyectos Tareas]]), contenido markdown legacy →
  bloques BlockNote.
- El upsert es batch; debe reportar progreso y manejar errores sin dejar estados
  parciales silenciosos.
- Después de migrar, Dexie no se usa más como store operativo ([[ADR-008 Estrategia de datos nube-first]]).

## Flujo de trabajo recomendado

1. **Lee** los archivos relevantes (`src/types/index.ts`, `src/db/database.ts`,
   `src/hooks/useProjects.ts`) si necesitas confirmar el estado actual.
2. **Explica** brevemente qué vas a modificar y por qué.
3. **Edita** en orden: tipos → esquema DB → hooks → componentes (si aplica).
4. **Verifica** con `npx tsc --noEmit` (y `pnpm lint`) sin errores.
