---
tags: [proceso, setup, herramientas]
status: permanente
date: 2026-09-13
---

# Setup y herramientas

## Contexto

Toolchain verificado en el entorno de desarrollo (Windows) el **2026-09-13**.
Este documento es la referencia para `/setup`: si algo falta, se instala o se
actualiza y se registra aquí.

## Contenido

| Herramienta | Versión verificada | Notas |
| --- | --- | --- |
| Node.js | 24.14.1 | Requisito del desktop: 20+ |
| pnpm | 9.1.2 | Gestor del workspace (`node-linker=hoisted`) |
| Git | 2.45.1 (windows.1) | |
| Supabase CLI | 2.98.2 | Actualización disponible: 2.117.0 (decidir en `/setup`) |
| Docker | 29.4.2 | Necesario para Supabase local |
| npx skills | 1.5.26 | Gestión de skills del proyecto |
| Obsidian | — | Abrir `docs/` como vault |

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

- Activar **Modo Desarrollador** de Windows: evita el fallo de symlinks de
  `winCodeSign` en el primer build de Electron ([[Builds de escritorio (Windows)]]).
- Docker Desktop debe estar corriendo para `supabase start`.

## Pendientes

- [ ] Decidir actualización de Supabase CLI (2.98.2 → 2.117.0).
- [ ] Registrar instalación de dependencias del desktop al ejecutar `/desktop`.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Supabase local y remoto]], [[Builds de escritorio (Windows)]]
- **ADR:** [[ADR-006 Workflow IA con RPI]]
