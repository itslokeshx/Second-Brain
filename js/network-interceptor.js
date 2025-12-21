(function () {
    // 1. JSON Patch: Prevents "Unexpected token" crashes on HTML 404s
    const originalParse = JSON.parse;
    JSON.parse = function (text) {
        if (!text) return {};
        if (typeof text === 'object') return text;
        try { return originalParse(text); }
        catch (e) {
            console.warn("JSON Parse failed, returning safe object");
            return { status: 0, success: true };
        }
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

            // --- AUTH SUCCESS HANDLER ---
            if ((url.includes('/login') || url.includes('/register')) && this.status === 200) {
                try {
                    const data = JSON.parse(this.responseText);

                    // Accept EITHER status: 0 (Legacy) OR success: true (Modern)
                    if (data.status === 0 || data.success) {
                        const u = data.user;

                        console.log('[Network] Login Success. Injecting Legacy Cookies...');

                        // 1. Set LocalStorage (Modern)
                        localStorage.setItem('authToken', data.token);
                        localStorage.setItem('userId', u.id);

                        // 2. Set LocalStorage (Legacy Keys)
                        localStorage.setItem('cookie.ACCT', u.email);
                        localStorage.setItem('cookie.NAME', u.name);
                        localStorage.setItem('cookie.UID', u.id);

                        // 3. Set DOCUMENT COOKIE (Shim for file://)
                        // Note: On file://, document.cookie is often disabled or doesn't persist.
                        // We try standard setting, AND we shim the getter if possible.

                        const cookieString = `ACCT=${u.email}; NAME=${encodeURIComponent(u.name)}; UID=${u.id}`;

                        try {
                            document.cookie = cookieString;
                        } catch (e) { }

                        // Force shim if document.cookie is empty after setting (common in file://)
                        if (!document.cookie && Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')) {
                            console.warn('[Network] Shimming document.cookie for file:// protocol');
                            try {
                                Object.defineProperty(document, 'cookie', {
                                    get: function () { return cookieString; },
                                    set: function () { /* no-op */ },
                                    configurable: true
                                });
                            } catch (e) {
                                console.error('[Network] Failed to shim cookie', e);
                            }
                        }

                        // Force Reload to render correct name
                        setTimeout(() => window.location.reload(), 500);
                    }
                } catch (e) { console.error("Auth Interceptor Error", e); }
            }
        });
        return originalSend.apply(this, args);
    };

    console.log('[Network] Interceptor Active. Legacy Cookies Emulation Ready.');
})();
