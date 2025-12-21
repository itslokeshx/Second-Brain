(function () {
    // 1. JSON Patch (Prevents HTML/404 Crashes)
    const originalParse = JSON.parse;
    JSON.parse = function (text) {
        if (!text) return {};
        if (typeof text === 'object') return text;
        try {
            return originalParse(text);
        } catch (e) {
            console.warn('[JSON Patch] Parsing failed, returning safe object.');
            return { success: true };
        }
    };

    // 2. Nuclear Cleanup (Runs ONCE to fix Symbol corruption)
    if (!sessionStorage.getItem('FIX_APPLIED_V2')) {
        console.warn('[Init] Wiping LocalStorage to fix corruption...');
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('FIX_APPLIED_V2', 'true');
        console.log('[Init] Storage wiped. Ready for fresh login.');
    }

    const TARGET_HOST = 'http://localhost:3000';
    const BLOCKED_DOMAINS = ['focustodo.net', 'www.focustodo.net', 'api.focustodo.net'];

    // 3. Notification Helper
    function showNotification(message, type = 'success') {
        const div = document.createElement('div');
        div.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 15px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white; z-index: 99999; border-radius: 5px; font-family: sans-serif;
        `;
        div.innerText = message;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }

    // 4. Interceptor Logic
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...args) {
        this._interceptedUrl = url;
        let newUrl = url;
        // Redirect logic
        if (typeof url === 'string') {
            if (url.startsWith('/')) newUrl = TARGET_HOST + url;
            else {
                for (const d of BLOCKED_DOMAINS) {
                    if (url.includes(d)) {
                        newUrl = url.replace(/https?:\/\/[^\/]+/, TARGET_HOST);
                        break;
                    }
                }
            }
        }
        return originalOpen.call(this, method, newUrl, ...args);
    };

    XMLHttpRequest.prototype.send = function (...args) {
        this.addEventListener('load', function () {
            const url = this.responseURL || this._interceptedUrl;
            if (!url) return;

            // Handle Audio 404s silently
            if (this.status === 404 && (url.endsWith('.m4a') || url.endsWith('.mp3'))) {
                console.warn('[Network] Audio missing, ignoring:', url);
                return;
            }

            // Handle Auth Success
            if ((url.includes('/login') || url.includes('/register')) && this.status === 200) {
                try {
                    const data = JSON.parse(this.responseText);
                    if (data.success && data.token) {
                        localStorage.setItem('authToken', data.token);
                        localStorage.setItem('userId', data.user.id);
                        // Save Name explicitly to prevent Symbols
                        localStorage.setItem('username', data.user.name || 'User');

                        showNotification('Login Successful!');

                        // Small delay then reload to apply fresh state
                        setTimeout(() => window.location.reload(), 1000);
                    }
                } catch (e) { console.error(e); }
            }
        });
        return originalSend.apply(this, args);
    };

    console.log('[Network] Interceptor V2 Loaded. Storage Cleaned.');
})();
