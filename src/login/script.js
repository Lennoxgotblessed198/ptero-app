const { ipcRenderer } = require('electron');
const path = require('path');

ipcRenderer.invoke('get-config').then(cfg => {
    if (cfg && cfg.domain) {
        const input = document.getElementById('domain-input');
        input.value = cfg.domain.replace(/^https?:\/\//, '');
    }
}).catch(() => {});

document.getElementById('min-btn').addEventListener('click', () => {
    ipcRenderer.invoke('window-minimize');
});

document.getElementById('close-btn').addEventListener('click', () => {
    ipcRenderer.invoke('window-close');
});

// Domain form submission
document.getElementById('domain-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const domainInput = document.getElementById('domain-input');
    const domain = domainInput.value.trim();
    
    if (!domain) {
        alert('Please enter a domain');
        return;
    }
    
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Connecting...';
    submitBtn.disabled = true;
    
    try {
        await ipcRenderer.invoke('submit-domain', domain);
    } catch (error) {
        console.error('Error submitting domain:', error);
        alert('Failed to connect to domain');
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('domain-input').focus();
});

document.getElementById('clear-btn').addEventListener('click', async () => {
    await ipcRenderer.invoke('clear-domain');
    const input = document.getElementById('domain-input');
    input.value = '';
    input.focus();
});