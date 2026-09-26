---
tags: [tecnico, mobile, flutter, android]
status: borrador
date: 2026-09-20
---

# App móvil (Flutter)

App Android de SisyFlow, paridad funcional con el desktop sobre el mismo
backend Supabase. Decisión y alcance: [[ADR-015 App movil Flutter (Android)]].

## Contexto

El hábito diario se registra mejor desde el teléfono. La app reutiliza las
tablas, la RLS y las RPCs de gamificación existentes: **no hay cambios de
backend**. La migración Sísifo (Dexie) y el empaquetado Electron son exclusivos
del desktop.

## Contenido

### Ubicación y stack

- Paquete `apps/mobile/` (`sisyflow_mobile`), Android primero; pnpm lo ignora
  (no tiene `package.json`).
- Flutter estable (verificado con 3.47.5 / Dart 3.13), Material Design 3 con
  semilla `#6750A4` y tema claro/oscuro/sistema persistido.
- `supabase_flutter` con publishable key + RLS; sesión persistida en
  shared_preferences; deep links vía `app_links`.
- Arquitectura MVVM + Provider (skill oficial `flutter-apply-architecture-best-practices`):
  `lib/data` (modelos, mappers, repositorios) y `lib/features` (View + ViewModel
  con `ChangeNotifier`). UI optimista con reversión y aviso.
- Navegación con `go_router`: `NavigationBar` inferior (Inicio/Épicas/Ajustes),
  detalle de proyecto y búsqueda apilados; redirect por sesión.

### Funcionalidad (v1)

- Auth email/contraseña con confirmación por email; deep link
  `sisyflow://auth/callback` (mismo allowlist que el desktop, intent-filter en
  `AndroidManifest.xml`).
- Inicio: hero de racha (global o por épica), heatmap de 126/365 días
  (componente propio), chips de racha por épica, «Tareas del día» con check de
  recurrentes y proyectos agrupados por épica con progreso.
- Épicas: CRUD con color.
- Proyecto: tareas con estado/prioridad/urgencia/vencimiento, orden y filtros,
  secciones Pendientes/Completados/Cancelados, sheet de detalle con editor e
  historial, y gestión de etiquetas.
- Recurrentes: periodicidad, contador del período, deshacer, historial y
  conversión de completada → recurrente conservando el completado (ADR-014).
- Gamificación: RPCs `daily_epic_logs_tz`, `epic_streaks` y `streak_global` con
  la zona horaria IANA del dispositivo (`flutter_timezone`).
- Ajustes: tema, cuenta/cerrar sesión y backup JSON v4 (export vía share sheet,
  import v3/v4 con selector de archivos).
- Editor: `appflowy_editor` con adaptador BlockNote JSON
  (`lib/data/blocknote_adapter.dart`); soporta párrafos, encabezados 1–3,
  listas (viñetas/numerada/check), cita, código y separador, con estilos
  inline y links. Tipos no soportados degradan a texto (sin pérdida).

### Entorno y build

- `env.json` (gitignored) con `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`;
  se inyecta con `--dart-define-from-file=env.json`. Plantilla en
  `env.json.example`.
- Comandos: `flutter analyze`, `flutter test`, `flutter run` y
  `flutter build apk --debug`; el APK queda en
  `build/app/outputs/flutter-apk/app-debug.apk`.

### Verificación (2026-09-20)

- `flutter analyze` sin issues y `dart format` aplicado.
- 13 tests unitarios en verde (mappers, períodos de recurrencia y adaptador
  BlockNote con ida y vuelta).
- `flutter build apk --debug` compila.

### Verificación (2026-09-26)

- Prueba E2E manual en emulador Android (Pixel 5 / API 34) contra el Supabase
  remoto de producción, con el APK compilado con
  `--dart-define-from-file=env.json`. Login y datos reales cargan bien.
- Se detectó que las tarjetas del listado de **Proyectos** (Inicio) no
  renderizaban: `ProjectCard` usaba `Row(crossAxisAlignment:
  CrossAxisAlignment.stretch)` dentro de un `ListView` de altura ilimitada, lo
  que dejaba la sección en blanco. Se corrigió envolviendo el `Row` en
  `IntrinsicHeight` (`lib/features/home/widgets/project_card.dart`).
- Se agregó el test de regresión `test/project_card_test.dart` (render dentro de
  un `ListView`) y se reemplazó el `widget_test.dart` de plantilla que no
  compilaba. `flutter analyze` sin issues y 14 tests en verde.
- `flutter build apk --release` compila (firma con clave debug; no apto para
  Play Store).

## Pendientes

- [~] E2E manual en emulador: hecho contra Supabase remoto (producción); resta
      la pasada contra Supabase local (login, CRUD, recurrentes, heatmap,
      editor, backup).
- [ ] Verificar el deep link de confirmación de email en Android.
- [ ] Evaluar notificaciones locales de recordatorio diario (fuera de v1).
- [ ] Revisar `appflowy_editor` (MPL-2.0, última release dic-2025) al actualizar
      Flutter; el adaptador aísla el cambio a `flutter_quill` si hiciera falta.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Capa de datos Supabase]], [[Modelo de datos objetivo (Supabase)]], [[Gamificacion]], [[Paridad funcional con TodoDex]]
- **ADR:** [[ADR-015 App movil Flutter (Android)]], [[ADR-008 Estrategia de datos nube-first]], [[ADR-014 Tareas recurrentes]]
- **Ruta en el monorepo:** `apps/mobile/`
