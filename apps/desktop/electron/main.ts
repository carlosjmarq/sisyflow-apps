import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// Deep link de autenticación: los correos de Supabase (confirmación, recuperación)
// redirigen a `sisyflow://auth/callback#...` y el SO abre la app con esa URL.
const PROTOCOL = 'sisyflow'
const AUTH_URL_PREFIX = 'sisyflow://'

let win: BrowserWindow | null
let rendererReady = false
let pendingAuthUrl: string | null = null

function findAuthUrl(args: string[]): string | null {
  return args.find((arg) => arg.startsWith(AUTH_URL_PREFIX)) ?? null
}

function deliverAuthUrl(url: string) {
  if (win && !win.isDestroyed() && rendererReady) {
    win.webContents.send('auth:callback', url)
  } else {
    pendingAuthUrl = url
  }
}

function registerProtocolClient() {
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])])
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL)
  }
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#141218' : '#FEF7FF',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  win.webContents.on('did-start-loading', () => {
    rendererReady = false
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

ipcMain.on('auth:ready', () => {
  rendererReady = true
  if (pendingAuthUrl && win && !win.isDestroyed()) {
    win.webContents.send('auth:callback', pendingAuthUrl)
    pendingAuthUrl = null
  }
})

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const url = findAuthUrl(argv)
    if (url) deliverAuthUrl(url)
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  registerProtocolClient()

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
      win = null
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  app.whenReady().then(() => {
    createWindow()

    const launchUrl = findAuthUrl(process.argv)
    if (launchUrl) deliverAuthUrl(launchUrl)
  })
}
