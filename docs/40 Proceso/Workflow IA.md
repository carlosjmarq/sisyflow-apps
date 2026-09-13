---
tags: [proceso, workflow-ia, harness]
status: permanente
date: 2026-09-13
---

# Workflow IA

## Contexto

Documentación operativa del harness de IA de SisyFlow
([[ADR-006 Workflow IA con RPI]]): qué existe, dónde vive y cómo se usa.

## Contenido

### Componentes

| Componente | Ruta | Función |
| --- | --- | --- |
| Config OpenCode | `opencode.json` | Carga `AGENTS.md`, skills, referencia `vault` y permisos |
| Contrato raíz | `AGENTS.md` | Arquitectura, fases, reglas, DoD |
| Contratos por carpeta | `apps/desktop/AGENTS.md`, `backend/AGENTS.md`, `docs/AGENTS.md` | Convenciones locales y comandos |
| Agentes | `.opencode/agent/` | `desktop`, `backend`, `docs` (subagentes con permisos acotados) |
| Comandos | `.opencode/command/` | Fases y utilidades (tabla abajo) |
| Skills | `.agents/skills/` | Dominio; se cargan ANTES de codificar |

### Comandos

| Comando | Tipo | Función |
| --- | --- | --- |
| `/setup` | fase | Verificar toolchain y actualizar [[Setup y herramientas]] |
| `/desktop` | fase 1 | Copiar TodoDex → SisyFlow con paridad ([[Fases del proyecto]]) |
| `/backend` | fase 2 | `supabase init`, esquema, RLS, auth base |
| `/cloud` | fase 3 | Cliente Supabase, login, migración Sísifo, UI optimista |
| `/hierarchy` | fase 4 | Épicas > Proyectos > Tareas |
| `/gamification` | fase 5 | Heatmap y rachas |
| `/deliver` | fase 6 | Builds, READMEs, checklist final |
| `/adr` | utilidad | Crear ADR numerado en `10 Diseno/` |
| `/nota` | utilidad | Crear nota con plantilla en el vault |

### Skills

Instaladas a nivel proyecto en `.agents/skills/` (gestionadas con `npx skills`):

| Skill | Fuente | Uso |
| --- | --- | --- |
| `supabase` | `supabase/agent-skills` | Cliente, auth, CLI en general |
| `supabase-postgres-best-practices` | `supabase/agent-skills` | Esquema, RLS, performance |
| `vercel-react-best-practices` | `vercel-labs/agent-skills` | Componentes y hooks React |
| `electron-dev` | `pedronauck/skills` | Procesos main/preload/renderer |
| `obsidian` | `synapsync/skills-registry` | Reglas y validación del vault |
| `frontend-design` | `anthropics/skills` | Dirección visual |
| `sisyflow-db` | local (adaptada de `tododex-db`) | Capa de datos Dexie/migración |

Comandos: `npx skills add <repo> -s <skill> -y`, `npx skills update`, `npx skills list`.
El CLI crea enlaces para otros agentes (`.claude/`); esa carpeta está gitignored
en este repo y no se versiona.

### Ciclo de una tarea

1. Leer la nota del vault y la US ([[US's for personal development project]]).
2. Cargar skills del dominio.
3. Pasar por [[RPI Research Plan Implement]] (documentar antes de codificar).
4. Implementar y validar (DoD).
5. Actualizar vault + MOC y cerrar con reporte.

### Cómo agregar una user story

1. Agregarla al backlog `[[US's for personal development project]]` (00 Inbox).
2. Al diseñarla, desprenderla a nota en `10 Diseno/` o `20 Tecnico/` con
   wikilink al US.
3. Si implica una decisión de arquitectura, crear ADR.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[RPI Research Plan Implement]], [[Fases del proyecto]]
- **ADR:** [[ADR-003 Vault Obsidian como fuente de verdad]], [[ADR-006 Workflow IA con RPI]]
- **Ruta en el monorepo:** `.opencode/`, `.agents/`, `opencode.json`
