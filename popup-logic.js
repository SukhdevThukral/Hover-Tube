document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('save-key');
    const status = document.getElementById('save-status');

    chrome.storage.local.get(['gem_api'], (result) => {
        if (result.gem_api) input.value = '••••••••••••••••';
    });

    saveBtn.addEventListener('click', () => {
        const key = input.value.trim();
        if (key && !key.includes('•')) {
            chrome.storage.local.set({gem_api: key}, () => {
                status.style.opacity = '1'
                setTimeout(() => status.style.opacity = '0', 2000);
            });
        }
    });
});