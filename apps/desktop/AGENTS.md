# apps/desktop — App Electron (SisyFlow)

App de escritorio de SisyFlow. Parte del monorepo `sisyflow-apps` ([[ADR-002 Monorepo unico]]).

> Estado (Fase 1, 2026-09-13): código copiado desde TodoDex y renombrado a
> SisyFlow ([[ADR-004 Base de escritorio TodoDex a SisyFlow]]). Paquete
> `sisyflow-desktop@0.1.0` en el workspace pnpm de la raíz.

## Stack

- Electron 30 + Vite 5 (`vite-plugin-electron`, `vite-plugin-electron-renderer`)
- React 18 + TypeScript estricto + Tailwind CSS 3 con tokens Material Design 3
  (light/dark, [[ADR-012 Rediseno UI Material Design 3]])
- Animación con `motion` e iconos `material-symbols` (Rounded, auto-hospedados)
- Editor de contenido: BlockNote + Mantine 8 ([[Editor de contenido (BlockNote)]])
- Datos: Supabase nube-first con UI optimista ([[Capa de datos Supabase]]);
  Dexie 4 queda solo como origen de la migración Sísifo
- Auth: Supabase email/contraseña con sesión persistente (`src/auth/`)
- Router: react-router-dom 7 (HashRouter)
- pnpm con `node-linker=hoisted` (`.npmrc` en la raíz del monorepo)

## Estructura

```
apps/desktop/
├── assets/            # icon.svg (fuente editable del ícono)
├── build/             # icon.png (1024) e icon.ico generados para electron-builder
├── electron/          # main.ts, preload.ts (contextBridge)
├── public/            # icon.png (ventana y favicon)
├── src/
│   ├── auth/          # AuthProvider, AuthScreen (Supabase auth)
│   ├── components/    # UI: listas, formularios, drawer, editor, Settings
│   │   ├── shell/     # AppShell, NavigationRail, TopAppBar, SearchOverlay, ShellContext
│   │   └── ui/        # primitivas (Button, Card, Dialog, Select, Toast...)
│   ├── data/          # mappers fila ↔ dominio
│   ├── db/            # database.ts (Dexie legacy), backup.ts (v3)
│   ├── hooks/         # hooks de datos con optimistic + reversión
│   ├── lib/           # supabase.ts (cliente), content.ts (markdown→bloques)
│   ├── migration/     # sisifo.ts (migración IndexedDB → Supabase)
│   ├── theme/         # ThemeProvider, ThemeContext (claro/oscuro persistido)
│   └── types/         # interfaces; supabase.ts (tipos generados)
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── electron-builder.json5
```

El shell (`src/components/shell/`) aporta el navigation rail Inicio/Épicas/Ajustes,
el top app bar contextual, el FAB y el snackbar; la ventana Electron arranca en
1280x840 con tamaño mínimo 960x640.

## Entorno

Copiar `.env.example` a `.env` (gitignored) con la URL y la publishable key de
Supabase local (`supabase status` en `backend/`). El renderer usa solo la
publishable key; la secret/service_role nunca va en la app.

Para builds de release, `.env.production` (gitignored) con la URL y publishable
key del proyecto remoto `sisyflow` (us-east-1); `pnpm build` en modo producción
las hornea en el bundle ([[Builds de escritorio (Windows)]]).

Auth por deep link: la app registra el esquema `sisyflow` (`electron/main.ts`,
single instance); los correos de Supabase vuelven a `sisyflow://auth/callback` y
el renderer establece la sesión (`src/auth/authCallback.ts`).

Ícono: la fuente editable es `assets/icon.svg` (paleta pastel, ver
[[Builds de escritorio (Windows)]]); los binarios `build/icon.png`, `build/icon.ico`
y `public/icon.png` se generan con `sharp-cli` y `png2icons`.

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
- **Estética**: la UI sigue tokens Material Design 3
  ([[ADR-012 Rediseno UI Material Design 3]]), que supersede la estética pastel
  "Nintendo OS" heredada de TodoDex. No reintroducir colores ni estilos pastel
  hardcodeados fuera de los tokens.
- Sin store global (zustand/redux): hooks + capa de datos, como el proyecto base.
- La capa de datos vive en hooks (`src/hooks/`) con mutaciones optimistas y
  reversión + aviso (`ToastProvider`); los componentes no importan el cliente
  Supabase directamente.
- Secretos solo por variables de entorno (`.env` gitignored); nunca hardcodeados.
- Cargar skills antes de codificar: `vercel-react-best-practices`, `electron-dev`,
  `frontend-design`, `sisyflow-db`, `supabase` según el área.
- Vault antes/después de cada tarea; commits `feat(desktop)` atómicos.

## DoD

- `pnpm lint` y `npx tsc --noEmit` verdes; `pnpm dev` levanta la app.
- Checklist de paridad sin regresiones.
- Vault actualizado (nota + MOC).
