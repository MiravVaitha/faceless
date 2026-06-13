// Electron shell for Faceless. Runs on plain Node — no Rust toolchain.
//
// In production we DON'T loadFile() the built index.html: Vite emits
// `<script type="module" crossorigin>`, which the browser refuses to load from
// the opaque file:// origin (CORS), giving a blank window. Instead we register
// a privileged `app://` scheme and serve dist/ through it, so the page runs on
// a secure, same-origin context exactly like it does on the web.
//
// In dev (ELECTRON_START_URL set, see `npm run app:dev`) we just point the
// window at the Vite dev server for hot reload.
const { app, BrowserWindow, protocol, net } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const DIST = path.join(__dirname, '..', 'dist')
const DEV_URL = process.env.ELECTRON_START_URL

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
])

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Faceless',
    backgroundColor: '#0a0a12', // no white flash before the canvas paints
    autoHideMenuBar: true, // hide the default menu bar; it's a game
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false, // the game is pure web; renderer needs no Node
    },
  })

  // single-user local game: grant pointer-lock / fullscreen without a prompt
  win.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(true))

  if (DEV_URL) {
    win.loadURL(DEV_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadURL('app://bundle/index.html')
  }
}

app.whenReady().then(() => {
  // serve the built bundle; refuse anything that escapes dist/
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url)
    const rel = pathname === '/' ? '/index.html' : decodeURIComponent(pathname)
    const filePath = path.join(DIST, rel)
    if (!filePath.startsWith(DIST)) return new Response('forbidden', { status: 403 })
    return net.fetch(pathToFileURL(filePath).toString())
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
