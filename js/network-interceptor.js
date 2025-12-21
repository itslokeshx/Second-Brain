(function () {
    // 1. JSON Patch (Prevents HTML/404 Crashes)
    const originalParse = JSON.parse;
    JSON.parse = function (text) {
        if (!text) return {};
        if (typeof text === 'object') return text;
        try { return originalParse(text); }
        catch (e) { return { success: true }; }
    };

    const TARGET_HOST = 'http://localhost:3000';
    const BLOCKED = ['focustodo.net', 'www.focustodo.net', 'api.focustodo.net'];

    // 2. Interceptor Logic
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...args) {
        this._interceptedUrl = url;
        let newUrl = url;
        if (typeof url === 'string') {
            if (url.startsWith('/')) newUrl = TARGET_HOST + url;
            else {
                for (const d of BLOCKED) {
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

            // --- CRITICAL FIX: Login Success Handler ---
            if ((url.includes('/login') || url.includes('/register')) && this.status === 200) {
                try {
                    const data = JSON.parse(this.responseText);
                    if (data.success && data.token) {
                        const u = data.user;
                        // Populate MODERN keys
                        localStorage.setItem('authToken', data.token);
                        localStorage.setItem('userId', u.id);

                        // Populate LEGACY keys (Fixes Symbol Language)
                        localStorage.setItem('cookie.ACCT', u.email);
                        localStorage.setItem('cookie.NAME', u.name);
                        localStorage.setItem('cookie.UID', u.id);

                        console.log('[Network] Auth Data & Legacy Keys Saved.');

                        // Force reload to apply changes
                        setTimeout(() => window.location.reload(), 500);
                    }
                } catch (e) { console.error(e); }
            }
        });
        return originalSend.apply(this, args);
    };

    console.log('[Network] Interceptor Active. Legacy Keys Patch applied.');
})();
