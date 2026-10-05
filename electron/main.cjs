const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('node:path')
const http = require('node:http')
const { fork } = require('node:child_process')

let mainWindow = null
let serverProcess = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
const BACKEND_PORT = Number(process.env.PORT || 3900)
const DEV_URL = process.env.ELECTRON_START_URL || 'http://localhost:7200'
const PROD_URL = `http://127.0.0.1:${BACKEND_PORT}`

// Helper: check if HTTP server is responding
function checkServerReady(url, maxAttempts = 30, intervalMs = 300) {
  return new Promise((resolve) => {
    let attempts = 0
    const check = () => {
      attempts++
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve(true)
        } else if (attempts < maxAttempts) {
          setTimeout(check, intervalMs)
        } else {
          resolve(false)
        }
      })
      req.on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(check, intervalMs)
        } else {
          resolve(false)
        }
      })
      req.setTimeout(1000, () => {
        req.destroy()
        if (attempts < maxAttempts) {
          setTimeout(check, intervalMs)
        } else {
          resolve(false)
        }
      })
    }
    check()
  })
}

// Start backend server child process if not already running
function startBackendServer() {
  return new Promise((resolve) => {
    // First probe if backend is already listening
    const probe = http.get(`http://127.0.0.1:${BACKEND_PORT}/api/health`, (res) => {
      console.log(`[Electron] Backend already active on port ${BACKEND_PORT}`)
      resolve(true)
    })
    probe.on('error', () => {
      // Not running, fork server/index.js
      const serverScript = path.resolve(__dirname, '..', 'server', 'index.js')
      console.log(`[Electron] Spawning background server from: ${serverScript}`)
      try {
        serverProcess = fork(serverScript, [], {
          env: {
            ...process.env,
            PORT: String(BACKEND_PORT)
          },
          stdio: 'inherit'
        })

        serverProcess.on('error', (err) => {
          console.error('[Electron] Backend server process error:', err)
        })

        serverProcess.on('exit', (code, signal) => {
          console.log(`[Electron] Backend server exited with code ${code}, signal ${signal}`)
        })

        // Wait until /api/health responds
        checkServerReady(`http://127.0.0.1:${BACKEND_PORT}/api/health`, 20, 300).then(() => {
          resolve(true)
        })
      } catch (err) {
        console.error('[Electron] Failed to spawn backend process:', err)
        resolve(false)
      }
    })
  })
}

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.png')

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#07090d',
    title: 'Signo Studio',
    icon: iconPath,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Prevent opening external URLs in Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Determine target URL to load
  const targetUrl = isDev ? DEV_URL : PROD_URL

  console.log(`[Electron] Loading UI from: ${targetUrl}`)

  checkServerReady(targetUrl, 40, 250).then(() => {
    if (mainWindow) {
      mainWindow.loadURL(targetUrl).catch((err) => {
        console.error('[Electron] Failed to load URL:', err)
      })
    }
  })
}

// IPC Handlers for window controls
ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize()
})

ipcMain.on('window:maximize', () => {
  if (!mainWindow) return
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }
})

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close()
})

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false
})

app.whenReady().then(async () => {
  // Set macOS Dock icon explicitly
  if (process.platform === 'darwin' && app.dock) {
    const iconPath = path.join(__dirname, '..', 'build', 'icon.png')
    try {
      app.dock.setIcon(iconPath)
    } catch (err) {
      console.error('[Electron] Failed to set dock icon:', err)
    }
  }

  await startBackendServer()
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

app.on('before-quit', () => {
  if (serverProcess) {
    console.log('[Electron] Terminating backend server child process...')
    serverProcess.kill()
    serverProcess = null
  }
})
