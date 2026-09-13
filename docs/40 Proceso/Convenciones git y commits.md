---
tags: [proceso, git, convenciones]
status: permanente
date: 2026-09-13
---

# Convenciones git y commits

## Contexto

SisyFlow es un **monorepo único** ([[ADR-002 Monorepo unico]]): app, backend y
documentación viven juntos y sus cambios viajan juntos.

## Contenido

### Commits

- **Conventional Commits** en español, imperativo y conciso.
- Tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, `style`, `perf`, `build`.
- Scopes por artefacto:
  - `feat(desktop)` — app Electron.
  - `feat(backend)` — migraciones, RLS, seed, funciones.
  - `docs(vault)` — notas, ADRs, MOC.
  - `chore(repo)` — harness, tooling, configuración.
- **Commits atómicos**: una feature completa toca desktop + backend + vault en el
  mismo commit (código, migración y nota juntos).
- Nunca commitear secretos: `.env` está gitignored.

### Ramas y versionado

- `main` siempre verde.
- Ramas de trabajo: `feat/<tema>`, `fix/<tema>`.
- Tags semver cuando haya instalables: `v0.1.0`, `v0.2.0`...

### Reglas de revisión (auto-revisión)

- Antes de commitear: `git status`, `git diff` y `git log --oneline -10` para
  revisar alcance y estilo.
- No mezclar refactors grandes con features en el mismo commit.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Relacionada con:** [[Workflow IA]], [[Fases del proyecto]]
- **ADR:** [[ADR-002 Monorepo unico]]
