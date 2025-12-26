/**
 * URL Interceptor - Redirect localhost API calls to Render backend
 * This patches main.js's hardcoded localhost:3000 references
 */

(function () {
    'use strict';

    const BACKEND_URL = 'https://second-brain-backend-saxs.onrender.com';

    console.log('[URL Interceptor] Installing localhost → Render redirector...');
    console.log('[URL Interceptor] Target:', BACKEND_URL);

    // Store original XMLHttpRequest
    const OriginalXHR = window.XMLHttpRequest;
    const originalOpen = OriginalXHR.prototype.open;
    const originalSend = OriginalXHR.prototype.send;

    // Override XMLHttpRequest.open to redirect localhost calls
    OriginalXHR.prototype.open = function (method, url, ...args) {
        // Check if URL contains localhost:3000
        if (typeof url === 'string' && (url.includes('localhost:3000') || url.startsWith('http://localhost:3000'))) {
            // Replace localhost:3000 with Render backend
            const newUrl = url.replace(/https?:\/\/localhost:3000/, BACKEND_URL);
            console.log(`[URL Interceptor] Redirected: ${url} → ${newUrl}`);
            return originalOpen.call(this, method, newUrl, ...args);
        }

        return originalOpen.call(this, method, url, ...args);
    };

    // Also patch fetch API
    const originalFetch = window.fetch;
    window.fetch = function (url, options) {
        if (typeof url === 'string' && (url.includes('localhost:3000') || url.startsWith('http://localhost:3000'))) {
            const newUrl = url.replace(/https?:\/\/localhost:3000/, BACKEND_URL);
            console.log(`[URL Interceptor] Fetch redirected: ${url} → ${newUrl}`);
            return originalFetch.call(this, newUrl, options);
        }
        return originalFetch.call(this, url, options);
    };

    console.log('[URL Interceptor] ✅ Installed - all localhost:3000 calls will redirect to Render');
})();
