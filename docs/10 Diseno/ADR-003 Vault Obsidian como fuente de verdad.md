---
tags: [adr, decision, documentacion]
status: Aceptado
date: 2026-09-13
---

# ADR-003 Vault Obsidian como fuente de verdad

## Status

Aceptado

## Contexto

El desarrollo asistido por IA necesita memoria persistente y contexto estable:
decisiones de diseño, funcionalidades, esquema de datos y proceso. Sin un lugar
único, el contexto se dispersa entre conversaciones y se pierde. El proyecto de
referencia `Prueba-Tecnica-Imagine` validó el patrón: vault Obsidian dentro del
monorepo, enlazado al harness de IA.

## Decisión

- `docs/` es un vault Obsidian y la **fuente de verdad** del proyecto.
- Estructura numerada: `00 Inbox`, `10 Diseno`, `20 Tecnico`, `30 Infraestructura`,
  `40 Proceso`, `90 Recursos`, `assets/`.
- Convenciones: frontmatter YAML (`tags`, `status`, `date`), wikilinks por nombre
  de archivo sin extensión, ADRs en formato Nygard, MOC siempre actualizado.
- El backlog de user stories vive en `00 Inbox` y se promueve a nota/ADR al diseñarse.
- `opencode.json` expone el vault como referencia (`references.vault`) para los agentes.
- Regla de tarea: **antes** de implementar se lee la nota relacionada; **después**
  se actualiza (y se crea ADR si hubo decisión significativa).

## Consecuencias

### Positivas

- Los agentes de IA obtienen contexto fiable y trazable en cada sesión.
- Cada decisión queda con su justificación (contexto, alternativas, consecuencias).
- El MOC permite navegación humana rápida y detección de notas huérfanas.

### Negativas / Trade-offs

- La documentación es parte del Definition of Done: agrega trabajo intencional a
  cada tarea de código.
- El vault debe mantenerse sincronizado; frontmatter y cuerpo pueden divergir si
  no se revisan (deuda observada en el proyecto de referencia).

### Neutrales

- El vault se abre con Obsidian, pero su contenido es Markdown plano versionado
  en git; no hay dependencia de plugins de Obsidian para trabajar.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[ADR-002 Monorepo unico]], [[ADR-006 Workflow IA con RPI]]
- **Afecta a:** todas las notas del vault, `docs/AGENTS.md`
- **Repo:** `docs/`, `opencode.json`
