---
tags: [adr, decision, mobile, flutter, arquitectura]
status: Aceptado
date: 2026-09-20
---

# ADR-015 App móvil Flutter (Android)

## Status

Aceptado — implementado el 2026-09-20 (US 5.1); queda pendiente el E2E manual en
dispositivo/emulador ([[App móvil (Flutter)]]).

## Contexto

SisyFlow es hoy una app de escritorio (Electron) más un CLI; ambos contra el
mismo backend Supabase ([[ADR-005 Supabase como backend]],
[[ADR-008 Estrategia de datos nube-first]]). Para empujar la roca desde el
teléfono (el caso de uso diario) se quiere una app móvil con **paridad
funcional** con el desktop: jerarquía Épica > Proyecto > Tarea, recurrentes,
gamificación (heatmap y rachas), tags, búsqueda y backup.

Alternativas consideradas: PWA (menos integración nativa, notificaciones y deep
links limitados), React Native (duplicaría el stack de UI sin reutilizar nada
del desktop), Flutter (UI declarativa, Material Design 3 nativo, un solo
lenguaje para Android/iOS/desktop, buen soporte de Supabase).

## Decisión

1. **App Flutter en el monorepo**: `apps/mobile/`, paquete `sisyflow_mobile`,
   Android primero (iOS/desktop pueden agregarse con `flutter create --platforms`
   más adelante). Comparte backend, vault y convenciones con el desktop.
2. **Arquitectura MVVM + Provider** (skills oficiales de Flutter:
   `flutter-apply-architecture-best-practices`): capas UI (View + ViewModel con
   `ChangeNotifier`) y datos (modelos, mappers y repositorios Supabase);
   repositorios inyectados por constructor; **UI optimista con reversión y aviso**
   (mismo contrato que [[Capa de datos Supabase]]).
3. **Material Design 3**: `ColorScheme.fromSeed` con el violeta de SisyFlow
   (`#6750A4`), claro/oscuro con preferencia persistida (paridad con
   [[ADR-012 Rediseno UI Material Design 3]]).
4. **Navegación**: `go_router` con redirect por sesión; `NavigationBar` inferior
   (Inicio/Épicas/Ajustes) y detalle de proyecto apilado.
5. **Datos**: `supabase_flutter` con **solo publishable key + RLS**; sesión
   persistida (shared_preferences); RPCs de gamificación con la zona horaria IANA
   del dispositivo ([[ADR-011 Gamificacion zona horaria rachas y heatmap]]).
   Sin Dexie ni migración Sísifo (exclusivas del desktop).
6. **Editor de contenido**: `appflowy_editor` con un **adaptador BlockNote JSON**
   (los bloques del desktop se conservan; tipos no soportados degradan a texto y
   se documentan). Contenido markdown legacy se edita como texto.
7. **Recurrentes**: misma semántica que [[ADR-014 Tareas recurrentes]] (períodos
   de calendario locales, historial en `todo_completions`, contador y deshacer).
8. **Auth con deep link**: se reutiliza el esquema `sisyflow://auth/callback` ya
   allowlisted en el proyecto de producción; en Android se registra un
   intent-filter equivalente.
9. **Backup**: export/import JSON compatible con el v4 del desktop
   (`epics`, `projects`, `todos`, `tags`, `completions`), con selector de
   archivos.
10. **Skills**: las oficiales `flutter/agent-plugins` y `dart-lang/skills` se
    instalan a nivel proyecto en `.agents/skills/` (gestión con `npx skills`).

## Consecuencias

### Positivas

- El hábito diario se puede registrar desde el teléfono con la misma cuenta y
  datos que el desktop; Supabase sigue siendo la única fuente de verdad.
- Material 3 nativo y una arquitectura por capas testeable (mappers, períodos de
  recurrencia y adaptador BlockNote con tests unitarios).
- Sin cambios de backend: se reutilizan tablas, RLS y RPCs existentes.

### Negativas / Trade-offs

- Un segundo cliente que mantener (UI duplicada respecto a Electron).
- `appflowy_editor` (MPL-2.0, última release dic-2025) es el riesgo principal:
  el adaptador aísla la dependencia para poder cambiar a `flutter_quill`.
- La conversión BlockNote ↔ appflowy es parcial para bloques exóticos (tablas,
  imágenes); se define el subconjunto soportado.

### Neutrales

- El monorepo convive con pnpm: `apps/mobile` no tiene `package.json`, así que
  pnpm lo ignora.
- La configuración de Supabase se inyecta con `--dart-define-from-file=env.json`
  (gitignored), igual que `.env` en el desktop.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-001 Eleccion de stack]], [[ADR-005 Supabase como backend]], [[ADR-008 Estrategia de datos nube-first]], [[ADR-011 Gamificacion zona horaria rachas y heatmap]], [[ADR-012 Rediseno UI Material Design 3]], [[ADR-014 Tareas recurrentes]]
- **Afecta a:** [[App móvil (Flutter)]], [[Capa de datos Supabase]], [[Gamificacion]], [[Paridad funcional con TodoDex]]
- **Repo:** `apps/mobile/`
