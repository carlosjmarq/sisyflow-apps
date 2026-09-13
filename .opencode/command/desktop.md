---
description: Fase 1 — copia TodoDex a apps/desktop y renombra la app a SisyFlow
agent: build
---

Fase 1 del proyecto ([[Fases del proyecto]]) con ciclo RPI obligatorio.

1. **Research.** Lee `docs/10 Diseno/ADR-004 Base de escritorio TodoDex a SisyFlow.md`, `docs/20 Tecnico/App de escritorio (base TodoDex).md` y `docs/20 Tecnico/Paridad funcional con TodoDex.md`. Inspecciona el origen `C:\Users\carlo\Documents\PersonalProjects\TEst-Opencode` (working tree completo, incluidos los cambios sin commitear). Carga las skills `electron-dev`, `vercel-react-best-practices` y `frontend-design`.
2. **Plan.** Confirma con el usuario la lista de archivos a copiar y los renombres. No copies: `node_modules/`, `dist/`, `dist-electron/`, `release/`, `.git/`, `docs/` del origen.
3. **Implement.**
   - Copia el working tree a `apps/desktop/`.
   - Renombra a SisyFlow: `package.json` (`name: sisyflow-desktop`, `description` nueva), `electron-builder.json5` (`appId: com.sisyflow.app`, `productName: SisyFlow`), `index.html` (título) y título de ventana.
   - Incluye `.npmrc` (`node-linker=hoisted`); no versionar `dist-electron/`.
   - `pnpm install`; verifica `pnpm lint`, `npx tsc --noEmit` y `pnpm dev`.
4. **Paridad.** Contrasta el inventario de `Paridad funcional con TodoDex` contra el código real, marca los ítems verificados y registra cualquier hallazgo.
5. **Cierre.** Actualiza ADR-004 (estado/referencias), las notas tocadas y el MOC. Commit `feat(desktop)` atómico con la documentación.
