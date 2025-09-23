const { app, BrowserWindow, ipcMain } = require('electron');
// Disable GPU to avoid crashes on some Windows setups
app.disableHardwareAcceleration();
const path = require('path');
const fs = require('fs');

let loginWindow;
let mainWindow;

function getConfigPath() {
  const userDir = app.getPath('userData');
  return path.join(userDir, 'config.json');
}

function loadConfig() {
  try {
    const p = getConfigPath();
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return {};
}

function saveConfig(cfg) {
  try {
    const p = getConfigPath();
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 420,
    height: 300,
    frame: false,
    titleBarStyle: 'hidden',
    resizable: false,
    show: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
      sandbox: false
    }
  });

  loginWindow.loadFile(path.join(__dirname, 'src', 'login', 'index.html'));

  loginWindow.on('closed', () => {
    loginWindow = null;
    if (!mainWindow) {
      app.quit();
    }
  });
}

function createMainWindow(domain) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0c090a',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
      webviewTag: true,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'main', 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('set-domain', domain);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (loginWindow) {
    loginWindow.close();
  }
}

app.whenReady().then(() => {
  const cfg = loadConfig();
  if (cfg && cfg.domain) {
    createMainWindow(cfg.domain);
  } else {
    createLoginWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const cfg = loadConfig();
    if (cfg && cfg.domain) {
      createMainWindow(cfg.domain);
    } else {
      createLoginWindow();
    }
  }
});

ipcMain.handle('submit-domain', async (event, domain) => {
  let url = (domain || '').trim();
  if (!url) return false;

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  const cfg = loadConfig();
  cfg.domain = url;
  saveConfig(cfg);

  createMainWindow(url);
  return true;
});

ipcMain.handle('clear-domain', () => {
  const cfg = loadConfig();
  delete cfg.domain;
  saveConfig(cfg);
});

ipcMain.handle('get-config', () => {
  return loadConfig();
});

ipcMain.handle('window-minimize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window.minimize();
});

ipcMain.handle('window-maximize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
});

ipcMain.handle('window-close', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window.close();
});