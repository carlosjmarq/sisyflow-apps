---
tags: [proceso, setup, herramientas]
status: permanente
date: 2026-09-13
---

# Setup y herramientas

## Contexto

Toolchain verificado en el entorno de desarrollo (Windows) el **2026-09-13**,
re-verificado al cerrar la Fase 0 con `/setup`. Este documento es la referencia
para `/setup`: si algo falta, se instala o se actualiza y se registra aquí.

## Contenido

| Herramienta | Versión verificada | Estado | Notas |
| --- | --- | --- | --- |
| Node.js | 24.14.1 | OK | Requisito del desktop: 20+ |
| pnpm | 9.1.2 | OK | Gestor del workspace (`node-linker=hoisted`) |
| Git | 2.45.1 (windows.1) | OK | |
| Supabase CLI | 2.117.0 | OK | Actualizada el 2026-09-13 vía `pnpm update -g supabase` (antes 2.98.2) |
| Docker | 29.4.2 | OK | CLI OK; **daemon no estaba corriendo** en la verificación (necesario para `supabase start`) |
| npx skills | 1.5.26 | OK | Gestión de skills del proyecto |
| Flutter | 3.47.5 (Dart 3.13.4) | OK | Actualizado el 2026-09-20 (antes 3.22.1); app móvil, ADR-015 |
| Android SDK | 36.0.0 | OK | Licencias aceptadas el 2026-09-20 (`flutter doctor --android-licenses`) |
| Obsidian | — | n/a | Abrir `docs/` como vault |

### Comandos de verificación

```powershell
node --version
pnpm --version
git --version
supabase --version
docker --version
npx skills --version
```

### Recomendaciones del entorno

- La raíz del monorepo es un **workspace pnpm** (`pnpm-workspace.yaml` + `.npmrc`
  con `node-linker=hoisted`): instalar desde la raíz y ejecutar scripts con
  `pnpm --filter sisyflow-desktop <script>`.
- Activar **Modo Desarrollador** de Windows: evita el fallo de symlinks de
  `winCodeSign` en el primer build de Electron ([[Builds de escritorio (Windows)]]).
- Docker Desktop debe estar corriendo para `supabase start`. Al verificar, el
  daemon estaba detenido: iniciarlo antes de la fase `/backend`.
- Para la app móvil: `flutter doctor` debe quedar verde en Android; el primer
  `flutter build apk` descarga Gradle y el NDK (~1 GB). No hay emulador creado
  todavía (`flutter emulators --create`) ni Visual Studio completo para builds
  de Windows (no requerido por el alcance Android).

## Pendientes

- [x] Actualizar Supabase CLI (2.98.2 → 2.117.0) — hecho el 2026-09-13.
- [x] Dependencias del desktop instaladas (Fase 1, 2026-09-13): `pnpm install`
      en la raíz del workspace (586 paquetes; Electron descargado).
- [x] Docker Desktop iniciado y stack local verificado (Fase 2, 2026-09-13).
      Los puertos de Supabase local se movieron a 453xx por rangos reservados
      de Windows ([[Supabase local y remoto]]).

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Supabase local y remoto]], [[Builds de escritorio (Windows)]]
- **ADR:** [[ADR-006 Workflow IA con RPI]]
