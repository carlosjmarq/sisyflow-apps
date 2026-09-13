---
description: Crea una nota nueva en el vault con la plantilla
agent: docs
---

Crea una nota a partir de: $ARGUMENTS

1. Carga la skill `obsidian`.
2. Elige la carpeta según el tipo:
   - `20 Tecnico/` — funcionalidad, datos, integración.
   - `30 Infraestructura/` — entornos, builds, despliegue.
   - `40 Proceso/` — fases, setup, convenciones, workflow.
   - `00 Inbox/` — captura rápida o user story (el backlog de US vive en
     `US's for personal development project`).
   - Si es una decisión de arquitectura, usa `/adr` en su lugar.
3. Copia `docs/90 Recursos/Templates/Nota.md` con el nombre de la nota y completa:
   frontmatter (`tags` apropiados, `status: borrador`, `date` de hoy) y secciones
   Contexto / Contenido / Pendientes / Relaciones.
4. Agrega wikilinks a notas relacionadas (y al ADR si aplica) y entra en el `MOC`.
   Sin notas huérfanas.
5. Reporta el archivo creado y los enlaces agregados.
