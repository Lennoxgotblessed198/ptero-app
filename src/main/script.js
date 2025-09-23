const { ipcRenderer } = require('electron');

document.getElementById('min-btn').addEventListener('click', () => {
    ipcRenderer.invoke('window-minimize');
});

document.getElementById('max-btn').addEventListener('click', () => {
    ipcRenderer.invoke('window-maximize');
});

document.getElementById('close-btn').addEventListener('click', () => {
    ipcRenderer.invoke('window-close');
});

const webview = document.getElementById('panel-view');
ipcRenderer.on('set-domain', (_evt, domain) => {
    if (!domain) return;
    webview.src = domain;
});