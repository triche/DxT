const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const { pathToFileURL } = require('url')

const appIconPath = path.join(__dirname, '..', 'public', 'DxT.png')

app.name = 'Design by Transformation'

const resolveAppUrl = () => {
  const envUrl = process.env.DXT_APP_URL || process.env.ELECTRON_START_URL
  if (envUrl) {
    if (envUrl.startsWith('http://') || envUrl.startsWith('https://') || envUrl.startsWith('file://')) {
      return envUrl
    }
    return pathToFileURL(path.resolve(envUrl)).toString()
  }

  if (!app.isPackaged && process.env.VITE_DEV_SERVER_URL) {
    return process.env.VITE_DEV_SERVER_URL
  }

  const indexPath = path.join(__dirname, '..', 'dist', 'index.html')
  return pathToFileURL(indexPath).toString()
}

const createWindow = () => {
  const appUrl = resolveAppUrl()
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Design by Transformation',
    backgroundColor: '#0f172a',
    icon: appIconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.loadURL(appUrl)

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    if (url !== appUrl) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
}

app.whenReady().then(() => {
  app.setName('Design by Transformation')
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(appIconPath)
  }
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
