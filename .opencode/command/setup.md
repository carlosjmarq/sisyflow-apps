---
description: Verifica el toolchain de desarrollo y actualiza la nota de Setup
agent: build
---

Verifica el entorno de desarrollo y actualiza el vault. **No instales nada sin confirmar.**

1. Lee `docs/40 Proceso/Setup y herramientas.md` (referencia vault) y ejecuta sus comandos de verificación:
   `node --version`, `pnpm --version`, `git --version`, `supabase --version`, `docker --version`, `npx skills --version`.
2. Reporta una tabla: herramienta | versión encontrada | estado (OK / falta / desactualizada).
3. Si algo falta o está desactualizado (p. ej. Supabase CLI 2.98.2 → 2.117.0), propón el comando exacto y espera confirmación del usuario.
4. Actualiza `docs/40 Proceso/Setup y herramientas.md` con la fecha y las versiones verificadas; marca los pendientes resueltos.
5. Cierra con el estado general y la fase siguiente (normalmente `/desktop`).
