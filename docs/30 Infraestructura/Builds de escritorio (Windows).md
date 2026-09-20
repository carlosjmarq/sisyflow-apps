---
tags: [infraestructura, desktop, windows, electron]
status: borrador
date: 2026-09-13
---

# Builds de escritorio (Windows)

## Contexto

Empaquetado de la app Electron de SisyFlow con `electron-builder` (heredado de
TodoDex). El objetivo es generar el instalador NSIS de Windows de forma
reproducible ([[App de escritorio (base TodoDex)]]).

## Contenido

### Configuración actual (heredada)

- `electron-builder.json5`: `appId com.sisyflow.app`, `productName SisyFlow`,
  `asar: true`, salida en `release/${version}`.
- Ícono: `build/icon.png` (1024) y `build/icon.ico` (Windows, instalador incluido);
  la ventana usa `public/icon.png`. Fuente editable en `assets/icon.svg`.
- Target Windows: `nsis` x64; artefacto
  `SisyFlow-Windows-<versión>-Setup.exe`.
- NSIS: instalación asistida (`oneClick: false`), permite elegir directorio,
  no borra datos del usuario al desinstalar.
- Comando: `pnpm build` (tsc + vite build + electron-builder).

### Build de producción (variables de entorno)

- `apps/desktop/.env.production` (gitignored) define `VITE_SUPABASE_URL` y
  `VITE_SUPABASE_PUBLISHABLE_KEY` del proyecto remoto
  ([[Supabase local y remoto]]); Vite las hornea en el bundle al compilar en
  modo producción y tienen prioridad sobre `.env` (local).
- Comando: `pnpm build` con `.env.production` presente → instalador
  `release/0.1.0/SisyFlow-Windows-0.1.0-Setup.exe`.
- Verificación post-build: el bundle (`dist/assets/*.js`) debe contener el
  project-ref de producción y **no** la URL local (`127.0.0.1:45321`).
- La versión de Electron queda **fijada** (`"electron": "30.0.1"`, sin `^`) para
  que electron-builder resuelva el binario con el layout hoisted de pnpm.
- Primer instalador de producción generado el 2026-09-13 (apunta a `sisyflow`
  en us-east-1).
- Segundo instalador de producción generado el 2026-09-20 con las tareas
  recurrentes (US 4.1, [[ADR-014 Tareas recurrentes]]): bundle verificado con
  el project-ref de producción y sin la URL local.

### Deep link de autenticación (`sisyflow://`)

- electron-builder registra el esquema `sisyflow` en el instalador NSIS
  (`protocols` en `electron-builder.json5`); `electron/main.ts` además llama a
  `app.setAsDefaultProtocolClient` (con soporte para desarrollo vía
  `process.defaultApp`).
- Los correos de Supabase (confirmación, recuperación) redirigen a
  `sisyflow://auth/callback#access_token=…`; el SO abre o enfoca la app (single
  instance) y el renderer establece la sesión con
  `supabase.auth.setSession` (`src/auth/authCallback.ts`).
- Requiere que el proyecto Supabase tenga el deep link como `site_url` y en la
  allowlist de redirects ([[Supabase local y remoto]]).
- El cliente pide `emailRedirectTo: sisyflow://auth/callback` al registrar y al
  reenviar la confirmación.

### Requisitos / gotchas conocidos (Windows)

- **Symlinks de `winCodeSign`**: el primer build puede fallar al extraer binarios
  con symlinks; solución: activar **Modo Desarrollador** de Windows o ejecutar
  como administrador. Documentado en el proyecto origen.
- La caché de electron-builder vive en `%LOCALAPPDATA%\electron-builder\Cache`
  (Electron y winCodeSign); el primer build descarga ~100 MB.
- `pnpm` requiere `node-linker=hoisted` (`.npmrc`) para que electron-builder
  detecte dependencias correctamente.
- Instalador **sin firma digital**: Windows SmartScreen mostrará advertencia.
- `release/` está gitignored: los instalables no se versionan.

### Ícono

- Fuente editable: `apps/desktop/assets/icon.svg` — Sísifo empujando la roca.
- Paleta (variante pastel):
  - Montaña `#D8D5F9`, persona + roca `#F0A3BE`, cara del círculo `#FAFAF5`,
    anillo `#E5E1EB`, sombra interior `#BFBBE8`.
- Regenerar binarios:
  - PNG: `npx --yes sharp-cli -i assets/icon.svg -o build/icon.png resize 1024 1024`
    (y `public/icon.png` a 512).
  - ICO: `npx --yes png2icons build/icon.png build/icon -ico`.

### Pendientes

- [x] Ícono propio de SisyFlow (Fase 5, 2026-09-13).
- [x] Renombre aplicado: `appId com.sisyflow.app`, `productName SisyFlow`,
      artefacto `SisyFlow-Windows-<versión>-Setup.exe` (Fase 1, 2026-09-13).
- [x] Versión inicial definida: `0.1.0` (salida en `release/0.1.0`).
- [ ] Verificar el ícono del instalador NSIS en el build de `/deliver`.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[App de escritorio (base TodoDex)]]
- **ADR:** [[ADR-001 Eleccion de stack]], [[ADR-004 Base de escritorio TodoDex a SisyFlow]]
- **Ruta en el monorepo:** `apps/desktop/electron-builder.json5`
