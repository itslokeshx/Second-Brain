/**
 * URL Interceptor - Redirect localhost API calls to Render backend
 * This patches main.js's hardcoded localhost:3000 references
 * AND injects Auth Tokens for cross-domain requests
 */

(function () {
    'use strict';

    // ✅ ENABLED: Redirect localhost requests to Render backend
    // This allows the local frontend to talk to the production database
    const BACKEND_URL = 'https://second-brain-backend-saxs.onrender.com';

    console.log('[URL Interceptor] Installing localhost → Render redirector...');
    console.log('[URL Interceptor] Target:', BACKEND_URL || 'localhost:3000 (local)');

    // Store original XMLHttpRequest
    const OriginalXHR = window.XMLHttpRequest;
    const originalOpen = OriginalXHR.prototype.open;
    const originalSend = OriginalXHR.prototype.send;

    // Override XMLHttpRequest.open to redirect localhost calls
    OriginalXHR.prototype.open = function (method, url, ...args) {
        // ✅ Skip redirection if BACKEND_URL is null (using local backend)
        if (!BACKEND_URL) {
            return originalOpen.call(this, method, url, ...args);
        }

        // Check if URL contains localhost:3000
        if (typeof url === 'string' && (url.includes('localhost:3000') || url.startsWith('http://localhost:3000'))) {
            // Replace localhost:3000 with Render backend
            const newUrl = url.replace(/https?:\/\/localhost:3000/, BACKEND_URL);
            console.log(`[URL Interceptor] Redirected: ${url} → ${newUrl}`);

            // CRITICAL: Enable credentials for cross-domain auth
            this.withCredentials = true;

            // INJECT TOKEN MANUALLY (Fix for 401 errors on legacy requests)
            // Legacy code (main.js) relies on cookies, which fail on cross-domain POSTs
            // We manually inject the Authorization header if we have a token
            try {
                const token = localStorage.getItem('authToken') || (window.SessionManager && window.SessionManager.token);

                if (token) {
                    const originalSetRequestHeader = this.setRequestHeader;
                    let authHeaderSet = false;

                    // 1. Wrap setRequestHeader to track if Authorization is set
                    this.setRequestHeader = function (header, value) {
                        try {
                            if (header && header.toLowerCase() === 'authorization') authHeaderSet = true;
                            return originalSetRequestHeader.apply(this, arguments);
                        } catch (e) {
                            return originalSetRequestHeader.apply(this, arguments);
                        }
                    };

                    // 2. Wrap send to inject header if missing
                    const originalSendFn = this.send;
                    this.send = function () {
                        if (!authHeaderSet && token) {
                            try {
                                // XHR must use the ORIGINAL setRequestHeader to work
                                originalSetRequestHeader.call(this, 'Authorization', 'Bearer ' + token);
                                console.log('[URL Interceptor] 💉 Injected Bearer token');
                            } catch (e) {
                                // If XHR state is wrong (shouldn't happen in send), warn but proceed
                                console.warn('[URL Interceptor] Failed to inject token:', e);
                            }
                        }
                        return originalSendFn.apply(this, arguments);
                    };
                }
            } catch (e) {
                console.error('[URL Interceptor] Token injection setup failed:', e);
            }

            return originalOpen.call(this, method, newUrl, ...args);
        }

        return originalOpen.call(this, method, url, ...args);
    };

    // Also patch fetch API
    const originalFetch = window.fetch;
    window.fetch = function (url, options) {
        // ✅ Skip redirection if BACKEND_URL is null (using local backend)
        if (!BACKEND_URL) {
            return originalFetch.call(this, url, options);
        }

        if (typeof url === 'string' && (url.includes('localhost:3000') || url.startsWith('http://localhost:3000'))) {
            const newUrl = url.replace(/https?:\/\/localhost:3000/, BACKEND_URL);
            console.log(`[URL Interceptor] Fetch redirected: ${url} → ${newUrl}`);
            return originalFetch.call(this, newUrl, options);
        }
        return originalFetch.call(this, url, options);
    };

    console.log('[URL Interceptor] ✅ Installed - all localhost:3000 calls will redirect to', BACKEND_URL || 'localhost:3000 (local)');
})();
