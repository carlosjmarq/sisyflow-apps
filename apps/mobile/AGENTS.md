# apps/mobile — App móvil (Flutter)

App Android de SisyFlow: paridad funcional con el desktop sobre el mismo
backend Supabase ([[ADR-015 App movil Flutter (Android)]]). Parte del monorepo
`sisyflow-apps`.

> Estado (2026-09-20): app creada con paridad v1 (auth, jerarquía, recurrentes,
> gamificación, editor, backup). Sin verificación en dispositivo físico todavía.

## Stack

- Flutter estable (verificado con 3.47.5 / Dart 3.13) + Material Design 3
  (`ColorScheme.fromSeed` con el violeta `#6750A4`, claro/oscuro persistido)
- `supabase_flutter` (publishable key + RLS; sesión en shared_preferences;
  deep links con `app_links`)
- `provider` (MVVM: View + ViewModel con `ChangeNotifier`) + `go_router`
- `appflowy_editor` con adaptador BlockNote JSON (`lib/data/blocknote_adapter.dart`)
- `flutter_timezone` (zona IANA para las RPCs de rachas), `file_picker` +
  `share_plus` (backup), `intl`

## Estructura

```
apps/mobile/
├── android/               # intent-filter sisyflow://auth/callback + INTERNET
├── env.json.example       # SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY
├── lib/
│   ├── core/              # env, theme (MD3 + preferencia), feedback, events
│   ├── data/              # models, mappers, recurrence, blocknote_adapter, repositories
│   ├── editor/            # ContentEditor (appflowy_editor ↔ BlockNote)
│   ├── features/          # auth, shell, home, epics, projects, search, settings
│   ├── shared/            # widgets y helpers (colores)
│   ├── app.dart           # MultiProvider + MaterialApp.router
│   ├── router.dart        # go_router (redirect por sesión, shell con NavigationBar)
│   └── main.dart
└── test/                  # unit tests (mappers, recurrencia, adaptador BlockNote)
```

## Comandos (dev)

```
flutter pub get
flutter analyze
dart format lib test
flutter test
flutter run --dart-define-from-file=env.json          # dispositivo/emulador
flutter build apk --debug --dart-define-from-file=env.json
```

`env.json` es gitignored; copiar de `env.json.example` (valores locales:
`supabase status` en `backend/`).

## Reglas

- **Paridad**: mismas funcionalidades que el desktop ([[Paridad funcional con TodoDex]]);
  sin migración Sísifo (Dexie es exclusivo del desktop).
- **UI optimista** con reversión y aviso (`lib/core/feedback.dart`), mismo
  contrato que [[Capa de datos Supabase]].
- Los componentes no llaman a Supabase: siempre ViewModels + repositorios.
- Nada de `service_role`: solo publishable key + RLS.
- Secretos por `--dart-define-from-file` (env.json gitignored).
- Editar la recurrencia de una tarea completada conserva el completado previo
  ([[ADR-014 Tareas recurrentes]]).
- Cargar skills antes de codificar: las oficiales `flutter/agent-plugins` y
  `dart-lang/skills` están en `.agents/skills/` (usar la herramienta `skill`).
- Vault antes/después de cada tarea; commits `feat(mobile)`.

## DoD

- `flutter analyze` y `dart format --set-exit-if-changed lib test` verdes.
- `flutter test` en verde.
- `flutter build apk --debug` compila.
- Vault actualizado (nota + MOC).
