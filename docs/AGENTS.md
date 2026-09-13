# docs — Vault Obsidian

Vault Obsidian de SisyFlow: **fuente de verdad** del proyecto ([[ADR-003 Vault Obsidian como fuente de verdad]]).

> Carpeta dentro del monorepo `sisyflow-apps` ([[ADR-002 Monorepo unico]]).

## Estructura

```
00 Inbox/           # MOC, captura rápida y backlog de user stories
10 Diseno/          # ADRs y decisiones (formato Nygard)
20 Tecnico/         # funcionalidades: app de escritorio, datos, backend, editor, gamificación
30 Infraestructura/ # Supabase, builds, despliegue
40 Proceso/         # fases, setup, RPI, convenciones, workflow IA
90 Recursos/        # plantillas (Nota, ADR)
assets/             # adjuntos y diagramas
```

## Uso

- Abrir la carpeta `docs/` como vault en Obsidian.
- Navegar desde `00 Inbox/MOC`.
- Notas nuevas: plantilla `[[Nota]]` (comando `/nota`).
- ADRs nuevos: plantilla `[[ADR]]` (comando `/adr`).
- User stories: se agregan a `[[US's for personal development project]]` en `00 Inbox/`;
  al diseñarse se promueven a nota en `10 Diseno/` o `20 Tecnico/` con wikilink al US.

## Reglas

- Wikilinks por nombre de archivo sin extensión.
- Cada tarea de código: revisar la nota relacionada ANTES, actualizarla DESPUÉS.
- Toda decisión significativa → ADR numerado en `10 Diseno/`.
- MOC siempre al día; sin notas huérfanas.
- Prosa en español, clara y completa. Nada de caveman en contenido persistido.
- Frontmatter obligatorio: `tags`, `status`, `date`.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Repo:** `AGENTS.md` raíz, `opencode.json` (reference `vault`)
