# apps/desktop — App Electron (SisyFlow)

App de escritorio de SisyFlow. Parte del monorepo `sisyflow-apps` ([[ADR-002 Monorepo unico]]).

> Estado (Fase 1, 2026-09-13): código copiado desde TodoDex y renombrado a
> SisyFlow ([[ADR-004 Base de escritorio TodoDex a SisyFlow]]). Paquete
> `sisyflow-desktop@0.1.0` en el workspace pnpm de la raíz.

## Stack

- Electron 30 + Vite 5 (`vite-plugin-electron`, `vite-plugin-electron-renderer`)
- React 18 + TypeScript estricto + Tailwind CSS 3 (estética pastel "Nintendo OS")
- Editor de contenido: BlockNote + Mantine 8 ([[Editor de contenido (BlockNote)]])
- Datos: Dexie 4 (IndexedDB) solo como origen de la migración; destino Supabase
  ([[ADR-008 Estrategia de datos nube-first]])
- Router: react-router-dom 7 (HashRouter)
- pnpm con `node-linker=hoisted` (`.npmrc` en la raíz del monorepo)

## Estructura (heredada de TodoDex)

```
apps/desktop/
├── electron/          # main.ts, preload.ts (contextBridge)
├── src/
│   ├── components/    # UI: listas, formularios, drawer, editor
│   │   └── ui/        # primitivas (Button, Card, Dialog, Select...)
│   ├── db/            # database.ts (Dexie), backup.ts
│   ├── hooks/         # useProjects y hooks de datos
│   └── types/         # interfaces y constantes; supabase.ts (tipos generados en Fase 2)
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── electron-builder.json5
```

## Renombre a SisyFlow (aplicado en la Fase 1)

- `package.json`: `name: sisyflow-desktop`, versión `0.1.0`, descripción nueva.
- `electron-builder.json5`: `appId com.sisyflow.app`, `productName SisyFlow`.
- `index.html` y header de la app: título SisyFlow.
- No se copió del origen: `node_modules/`, `dist/`, `dist-electron/`, `release/`,
  `.git/`, `docs/`, `AGENTS.md`, `opencode.json`, `.agents/` ni lockfiles.
- Se conservan a propósito `TodoDexDB` (base Dexie, migración Sísifo) y la clave
  `tododex.drawerWidth`; el backup exporta `sisyflow-backup-<fecha>.json`.

## Comandos (dev)

Instalar desde la raíz del monorepo (workspace pnpm):

```
pnpm install
```

Dentro de `apps/desktop/` (o desde la raíz: `pnpm --filter sisyflow-desktop <script>`):

```
pnpm dev                 # Vite + Electron
pnpm lint                # ESLint (0 warnings)
npx tsc --noEmit         # typecheck
pnpm build               # tsc + vite build + electron-builder
```

## Reglas

- **Paridad**: no romper ninguna funcionalidad de [[Paridad funcional con TodoDex]]
  (todos y editor de contenido). Cambios que la afecten requieren ADR.
- Sin store global (zustand/redux): hooks + capa de datos, como el proyecto base.
- Secretos solo por variables de entorno (`.env` gitignored); nunca hardcodeados.
- Cargar skills antes de codificar: `vercel-react-best-practices`, `electron-dev`,
  `frontend-design`, `sisyflow-db`, `supabase` según el área.
- Vault antes/después de cada tarea; commits `feat(desktop)` atómicos.

## DoD

- `pnpm lint` y `npx tsc --noEmit` verdes; `pnpm dev` levanta la app.
- Checklist de paridad sin regresiones.
- Vault actualizado (nota + MOC).
