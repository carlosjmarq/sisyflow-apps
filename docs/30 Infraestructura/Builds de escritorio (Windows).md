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
- Target Windows: `nsis` x64; artefacto
  `SisyFlow-Windows-<versión>-Setup.exe`.
- NSIS: instalación asistida (`oneClick: false`), permite elegir directorio,
  no borra datos del usuario al desinstalar.
- Comando: `pnpm build` (tsc + vite build + electron-builder).

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

### Pendientes

- [ ] Ícono propio de SisyFlow (hoy usa el genérico de Electron).
- [ ] Renombrar artefacto/configuración al copiar la app (fase `/desktop`).
- [ ] Definir número de versión inicial (`0.1.0`).

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[App de escritorio (base TodoDex)]]
- **ADR:** [[ADR-001 Eleccion de stack]], [[ADR-004 Base de escritorio TodoDex a SisyFlow]]
- **Ruta en el monorepo:** `apps/desktop/electron-builder.json5`
