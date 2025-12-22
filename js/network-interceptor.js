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

                        console.log('[Network] Login Success. User data:', u);

                        // ✅ Store clean user data in localStorage
                        localStorage.setItem('authToken', data.token);
                        localStorage.setItem('userId', u.id);
                        localStorage.setItem('userEmail', u.email);

                        // ✅ CRITICAL: Store name as clean string (no encoding)
                        const cleanName = String(u.name || u.email.split('@')[0]).trim();
                        localStorage.setItem('userName', cleanName);

                        console.log('[Network] Stored user data:', {
                            email: u.email,
                            name: cleanName,
                            id: u.id
                        });

                        // Force Reload to render correct name
                        setTimeout(() => window.location.reload(), 500);
                    } else {
                        console.warn('[Network] Login response status not 0/success:', data);
                    }
                } catch (e) { console.error("Auth Interceptor Error", e); }
            }
        });
        return originalSend.apply(this, args);
    };

    console.log('[Network] Interceptor Active. Legacy Cookies Emulation Ready.');
})();
