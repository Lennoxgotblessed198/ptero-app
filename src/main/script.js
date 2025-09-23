const { ipcRenderer } = require('electron');

// Window controls
['min','max','close'].forEach(action => {
    const idMap = { min:'min-btn', max:'max-btn', close:'close-btn' };
    const el = document.getElementById(idMap[action]);
    if (el) el.addEventListener('click', () => ipcRenderer.invoke(`window-${action==='min'?'minimize':action==='max'?'maximize':'close'}`));
});

const webview = document.getElementById('panel-view');
const titleSpan = document.getElementById('title-text');
const loginView = document.getElementById('login-view');
const domainForm = document.getElementById('domain-form');
const domainInput = document.getElementById('domain-input');

function showLogin() {
    loginView.style.display = 'block';
    document.getElementById('webview-container').style.display = 'none';
    titleSpan.textContent = 'Login';
    document.title = 'Login - Ptero App';
    setTimeout(()=>domainInput&&domainInput.focus(),30);
}
function showPanel(domain) {
    loginView.style.display = 'none';
    document.getElementById('webview-container').style.display = 'block';
    if (domain) webview.src = domain;
    try {
        const pretty = (domain||'').replace(/^https?:\/\//,'');
        if (titleSpan) titleSpan.textContent = pretty || 'Panel';
        if (pretty) document.title = pretty;
    } catch(_){}
}

ipcRenderer.on('set-domain', (_evt, domain) => {
  if (!domain) return showLogin();
  showPanel(domain);
});

showLogin();

if (domainForm) {
    domainForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const raw = (domainInput.value||'').trim();
        if (!raw) return;
        const btn = domainForm.querySelector('.submit-btn');
        const orig = btn.textContent;
        btn.textContent = 'Connecting...';
        btn.disabled = true;
        try {
            await ipcRenderer.invoke('submit-domain', raw);
        } catch (err) {
            console.error('Submit failed', err);
            btn.textContent = orig;
            btn.disabled = false;
            return;
        }
    });
}