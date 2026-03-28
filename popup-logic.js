document.addEventListener('DOMContentLoaded', () => {
    const inputContainer = document.getElementById('key-input-container');
    const activeContainer = document.getElementById('key-active-container');
    const inputField = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('save-key');
    const changeBtn = document.getElementById('change-key');
    const status = document.getElementById('save-status');

    chrome.storage.local.get(['gem_api'], (result) => {
        if (result.gem_api) {
            showActiveState();
        };
    });

    saveBtn.addEventListener('click', () => {
        const key = inputField.value.trim();
        if (key) {
            chrome.storage.local.set({gem_api: key}, () => {
                showActiveState();
                status.style.opacity = '1'
                setTimeout(() => status.style.opacity = '0', 2000);
            });
        }
    });

    changeBtn.addEventListener('click', () => {
        showInputState();
    });


    function showActiveState() {
        activeContainer.style.display= 'block';
        inputContainer.style.display = 'none';
    }

    function showInputState() {
        inputContainer.style.display= 'block';
        activeContainer.style.display = 'none';
        inputField = '';
        inputField.focus();
    }
});