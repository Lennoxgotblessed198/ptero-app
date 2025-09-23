const { app, BrowserWindow, ipcMain } = require('electron');
app.disableHardwareAcceleration();
const path = require('path');

let mainWindow; 

function createMainWindow(initialDomain) {
  if (mainWindow) return;
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
    if (initialDomain) mainWindow.webContents.send('set-domain', initialDomain);
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

ipcMain.handle('submit-domain', async (_event, domain) => {
  let url = (domain || '').trim();
  if (!url) return false;

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  if (mainWindow) {
    mainWindow.webContents.send('set-domain', url);
    return true;
  }

  createMainWindow(url);
  return true;
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