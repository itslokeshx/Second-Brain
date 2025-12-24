// Login Response Interceptor - Shows notifications for login attempts
(function () {
    'use strict';

    console.log('[Login Interceptor] Initializing...');

    // Intercept XMLHttpRequest to catch login responses
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...args) {
        this._url = url;
        this._method = method;
        return originalOpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function (...args) {
        const xhr = this;
        const url = xhr._url || '';

        // Intercept login/register responses
        if (url.includes('/login') || url.includes('/register')) {
            // Clear cookies BEFORE request to ensure clean state
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf('=');
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
            }

            const originalOnLoad = xhr.onload;
            const originalOnReadyStateChange = xhr.onreadystatechange;

            // Override onload
            xhr.onload = function () {
                try {
                    const response = JSON.parse(xhr.responseText);

                    // Check if login FAILED
                    if (response.status !== 0 || response.success === false) {
                        console.error('[Login Interceptor] ❌ LOGIN FAILED:', response.message || 'Authentication failed');

                        // CRITICAL: Clear cookies immediately to prevent main.js from thinking we are logged in
                        const cookies = document.cookie.split(';');
                        for (let i = 0; i < cookies.length; i++) {
                            const cookie = cookies[i];
                            const eqPos = cookie.indexOf('=');
                            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
                        }
                        console.log('[Login Interceptor] 🧹 Cookies cleared to prevent bypass');

                        // Show error notification
                        if (window.showNotification) {
                            window.showNotification(
                                response.message || 'Invalid credentials. Please try again.',
                                'error',
                                5000
                            );
                        }

                        // DON'T block the handler - let main.js handle it
                        // This allows retry attempts to work
                        console.warn('[Login Interceptor] Login failed. Reloading to prevent offline mode bypass.');

                        // FORCE RELOAD to stop main.js from entering "offline mode"
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);

                        // DO NOT CALL originalOnLoad - this prevents main.js from proceeding
                        return;
                    } else {
                        console.log('[Login Interceptor] ✅ Login successful');
                        if (window.showNotification) {
                            window.showNotification('Login successful! Reloading...', 'success', 2000);
                        }

                        // Force reload after success to ensure clean state
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    }
                } catch (e) {
                    console.error('[Login Interceptor] Error parsing response:', e);
                }

                // ALWAYS call original handler - let main.js decide what to do
                if (originalOnLoad) {
                    try {
                        return originalOnLoad.apply(this, arguments);
                    } catch (err) {
                        console.error('[Login Interceptor] CRITICAL: main.js crashed during onload:', err);

                        // Force UI recovery if main.js crashes
                        if (window.showNotification) {
                            window.showNotification('Login error handled. You can try again.', 'warning', 3000);
                        }

                        // Attempt to re-enable inputs/buttons if they got stuck
                        const buttons = document.querySelectorAll('button, input[type="submit"]');
                        buttons.forEach(btn => btn.disabled = false);
                    }
                }
            };

            // Also override onreadystatechange
            xhr.onreadystatechange = function () {
                // Just pass through - don't block anything
                if (originalOnReadyStateChange) {
                    return originalOnReadyStateChange.apply(this, arguments);
                }
            };
        }

        return originalSend.apply(this, args);
    };

    console.log('[Login Interceptor] ✅ Active - Showing notifications for login attempts');
})();
