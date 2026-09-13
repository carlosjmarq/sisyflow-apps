# apps/desktop — App Electron (SisyFlow)

App de escritorio de SisyFlow. Parte del monorepo `sisyflow-apps` ([[ADR-002 Monorepo unico]]).

> Estado (Fase 0): carpeta declarada. El código llega en la fase `/desktop` como copia de TodoDex (`TEst-Opencode`) renombrada a SisyFlow ([[ADR-004 Base de escritorio TodoDex a SisyFlow]]).

## Stack

- Electron 30 + Vite 5 (`vite-plugin-electron`, `vite-plugin-electron-renderer`)
- React 18 + TypeScript estricto + Tailwind CSS 3 (estética pastel "Nintendo OS")
- Editor de contenido: BlockNote + Mantine 8 ([[Editor de contenido (BlockNote)]])
- Datos: Dexie 4 (IndexedDB) solo como origen de la migración; destino Supabase
  ([[ADR-008 Estrategia de datos nube-first]])
- Router: react-router-dom 7 (HashRouter)
- pnpm con `node-linker=hoisted` (`.npmrc` en la raíz del paquete)

## Estructura (heredada de TodoDex)

```
apps/desktop/
├── electron/          # main.ts, preload.ts (contextBridge)
├── src/
│   ├── components/    # UI: listas, formularios, drawer, editor
│   │   └── ui/        # primitivas (Button, Card, Dialog, Select...)
│   ├── db/            # database.ts (Dexie), backup.ts
│   ├── hooks/         # useProjects y hooks de datos
│   └── types/         # interfaces y constantes de dominio
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── electron-builder.json5
```

## Renombre a SisyFlow (fase `/desktop`)

- `package.json`: `name` → `sisyflow-desktop`, `description` nueva.
- `electron-builder.json5`: `appId` → `com.sisyflow.app`, `productName` → `SisyFlow`.
- `index.html`: `<title>SisyFlow</title>` y ventana principal.
- NO copiar del origen: `node_modules/`, `dist/`, `dist-electron/`, `release/`,
  `.git/`, `docs/` (su contenido se migra al vault).

## Comandos (dev)

```
pnpm install
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
