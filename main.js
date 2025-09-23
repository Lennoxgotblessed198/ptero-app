const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
app.disableHardwareAcceleration();
const path = require('path');

let mainWindow; 

try {
  app.commandLine.appendSwitch('enable-features', 'WebContentsForceDark');
  app.commandLine.appendSwitch('force-dark-mode');
} catch (_) {}
nativeTheme.themeSource = 'dark';

const DARK_CSS = `:root { color-scheme: dark !important; }
html, body { background:#090909 !important; color:#d0d0d0 !important; }
img, picture, video, iframe { filter: brightness(.85) contrast(1.05); }
::-webkit-scrollbar { width:10px; }
::-webkit-scrollbar-track { background:#0d0d0d; }
::-webkit-scrollbar-thumb { background:#1e1e1e; border-radius:20px; }
::-webkit-scrollbar-thumb:hover { background:#272727; }`;

function injectDarkCSS(contents) {
  try { contents.insertCSS(DARK_CSS).catch(()=>{}); } catch (_) {}
  try { contents.setBackgroundColor('#090909'); } catch (_) {}
}

app.on('web-contents-created', (_e, contents) => {
  injectDarkCSS(contents);
});

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
    injectDarkCSS(mainWindow.webContents);
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