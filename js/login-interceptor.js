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

                        // ✅ NO RELOAD - Let user retry login
                        console.warn('[Login Interceptor] Login failed. User can retry.');

                        // DO NOT CALL originalOnLoad - this prevents main.js from proceeding
                        return;
                    } else {
                        // Detect if this is a register or login request
                        const isRegister = url.includes('/register');
                        const actionType = isRegister ? 'Registration' : 'Login';

                        console.log(`[Login Interceptor] ✅ ${actionType} successful`);

                        // ✅ REGISTER: Prevent auto-login, force manual login
                        if (isRegister) {
                            console.log('[Login Interceptor] 🔒 Registration complete - preventing auto-login');

                            // Show success message
                            if (window.showNotification) {
                                window.showNotification('Registration successful! Please login.', 'success', 3000);
                            }

                            // ✅ CRITICAL: Clear ALL cookies to prevent auto-login
                            const cookies = document.cookie.split(';');
                            for (let i = 0; i < cookies.length; i++) {
                                const cookie = cookies[i];
                                const eqPos = cookie.indexOf('=');
                                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
                            }
                            console.log('[Login Interceptor] 🧹 Cookies cleared - user must login manually');

                            // DO NOT CALL originalOnLoad - this prevents main.js from logging in
                            return;
                        }

                        // ✅ LOGIN: Show success and proceed
                        if (window.showNotification) {
                            window.showNotification('Login successful!', 'success', 2000);
                        }

                        // ✅ CRITICAL: Trigger SessionManager to initialize Guardian + Mutex
                        // Without this, Guardian/Mutex stay uninitialized after UI login
                        // causing sync to fail with "Hydration not ready" error
                        setTimeout(() => {
                            if (window.SessionManager && window.SessionManager.checkLoginStatus) {
                                console.log('[Login Interceptor] 🔄 Triggering SessionManager.checkLoginStatus()...');
                                window.SessionManager.checkLoginStatus();
                            }
                        }, 500); // Small delay to let cookies settle

                        // ✅ NO RELOAD - Let main.js render the UI naturally
                        console.log('[Login Interceptor] Allowing main.js to render UI...');
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
