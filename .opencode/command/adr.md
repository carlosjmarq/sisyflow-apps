---
description: Crea un ADR numerado en el vault (formato Nygard)
agent: docs
---

Crea un ADR a partir de: $ARGUMENTS

1. Carga la skill `obsidian`.
2. Determina el siguiente número leyendo los archivos de `docs/10 Diseno/` (formato `ADR-XXX`).
3. Copia la plantilla `docs/90 Recursos/Templates/ADR.md` como
   `docs/10 Diseno/ADR-XXX Titulo descriptivo.md` (sin acentos en el nombre del archivo).
4. Completa el contenido con $ARGUMENTS y el contexto del vault: **Contexto** (problema,
   alternativas), **Decisión** (afirmativa), **Consecuencias** (positivas,
   negativas/trade-offs, neutrales) y **Relaciones** (wikilinks a notas afectadas).
5. Deja el status en `Propuesto` salvo indicación contraria; el ADR se acepta al implementarse.
6. Agrega el ADR al `MOC` (sección 10 Diseno) y enlázalo desde las notas relacionadas.
7. Reporta el archivo creado y los enlaces agregados.
