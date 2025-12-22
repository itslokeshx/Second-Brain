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

    // 2. WebSocket Interceptor (Mock to prevent errors)
    const OriginalWebSocket = window.WebSocket;
    if (OriginalWebSocket) {
        window.WebSocket = function (url, ...args) {
            console.warn('[Network] Blocked WebSocket connection:', url);
            // Return dummy object
            return {
                send: () => { },
                close: () => { },
                addEventListener: () => { },
                removeEventListener: () => { },
                readyState: 0 // CONNECTING
            };
        };
        // Copy constants if needed by app
        ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(prop => {
            window.WebSocket[prop] = OriginalWebSocket[prop];
        });
    }

    // 3. Interceptor Logic
    // NOTE: This runs AFTER fix_i18n.js, so we're wrapping an already-wrapped XHR
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send; // This is already wrapped by fix_i18n

    XMLHttpRequest.prototype.open = function (method, url, ...args) {
        this._interceptedUrl = url;
        this._interceptedMethod = method;
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

        // ✅ CRITICAL: Force credentials for all requests to backend
        // This ensures cookies (JSESSIONID) are sent even if cross-origin (dev)
        const result = originalOpen.call(this, method, newUrl, ...args);

        // Forcefully set it immediately after open
        if (newUrl.includes('localhost:3000') || newUrl.includes('127.0.0.1:3000')) {
            try {
                this.withCredentials = true;
            } catch (e) {
                console.warn('[Network] Failed to set withCredentials:', e);
            }
        }
        return result;
    };

    XMLHttpRequest.prototype.send = function (...args) {
        const xhr = this;

        // Add load listener BEFORE calling send
        const loadHandler = function () {
            const responseUrl = xhr.responseURL || xhr._interceptedUrl;
            if (!responseUrl) return;

            // --- AUTH SUCCESS HANDLER ---
            // Match BOTH legacy (/v63/user/login, /v63/user/register) AND modern (/api/auth/*) endpoints
            const isAuthEndpoint = responseUrl.includes('/login') ||
                responseUrl.includes('/register') ||
                responseUrl.includes('/v63/user/login') ||
                responseUrl.includes('/v63/user/register') ||
                responseUrl.includes('/api/auth/login') ||
                responseUrl.includes('/api/auth/register');

            if (isAuthEndpoint && xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText);

                    const jsessionId = data.jsessionId || data.sessionId || data.token || '';
                    const authToken = data.token || jsessionId;

                    console.log('[Network] Auth response received:', {
                        url: responseUrl,
                        status: data.status,
                        success: data.success,
                        hasToken: !!authToken,
                        hasUser: !!data.user,
                        hasJSession: !!jsessionId
                    });

                    // Accept EITHER status: 0 (Legacy) OR success: true (Modern)
                    if (data.status === 0 || data.success) {
                        const u = data.user || {
                            email: data.acct || '',
                            id: data.uid || data.pid || '',
                            name: data.name || ''
                        };

                        if (!u.id && data.uid) u.id = data.uid;
                        if (!u.email && data.acct) u.email = data.acct;

                        if (!u.id) {
                            console.error('[Network] Invalid user data in response:', data);
                            return;
                        }

                        console.log('[Network] Login Success. User data:', u);

                        // ✅ Store clean user data in localStorage
                        localStorage.setItem('authToken', authToken);
                        localStorage.setItem('userId', u.id);
                        localStorage.setItem('userEmail', u.email);

                        // ✅ CRITICAL: Store name as clean string (no encoding)
                        const cleanName = String(u.name || (u.email ? u.email.split('@')[0] : 'User')).trim();
                        localStorage.setItem('userName', cleanName);

                        // ✅ CRITICAL: Set legacy "cookie.*" keys expected by main.js
                        localStorage.setItem('cookie.NAME', cleanName);
                        localStorage.setItem('cookie.ACCT', u.email);
                        localStorage.setItem('cookie.UID', u.id);
                        localStorage.setItem('cookie.PID', u.id);
                        if (jsessionId) localStorage.setItem('cookie.JSESSIONID', jsessionId);

                        // Also mirror to real cookies for any other checks (plain text)
                        document.cookie = `NAME=${cleanName}; path=/; max-age=31536000`;
                        document.cookie = `ACCT=${u.email}; path=/; max-age=31536000`;
                        document.cookie = `UID=${u.id}; path=/; max-age=31536000`;
                        if (jsessionId) {
                            // Note: server sets HttpOnly/Lax cookie, but we can set a readable one for JS
                            document.cookie = `JSESSIONID=${jsessionId}; path=/; max-age=31536000; SameSite=Lax`;
                        }

                        console.log('[Network] ✅ Stored user data:', {
                            email: u.email,
                            name: cleanName,
                            id: u.id,
                            token: authToken ? authToken.substring(0, 20) + '...' : ''
                        });
                        console.log('[Network] ✅ Set cookies/localStorage: NAME, ACCT, UID, PID, JSESSIONID');
                        console.log('[Network] ✅ Reloading page in 500ms...');

                        // Force Reload to render correct name
                        setTimeout(() => window.location.reload(), 500);
                    } else {
                        console.warn('[Network] Login response status not 0/success:', data);
                    }
                } catch (e) {
                    console.error("[Network] Auth Interceptor Error:", e);
                }
            }
        };

        // Use addEventListener instead of direct assignment to avoid conflicts
        this.addEventListener('load', loadHandler);

        // Call the original (or fix_i18n-wrapped) send
        return originalSend.apply(this, args);
    };

    console.log('[Network] Interceptor Active. Legacy Cookies Emulation Ready. WebSocket Mocked.');
})();
