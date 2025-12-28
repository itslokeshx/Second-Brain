/**
 * Logout Interceptor - Hook into React's native logout
 * 
 * STRATEGY: Let React handle the logout dialog and flow naturally
 * We just monkey-patch the AccountManager's logout to ALSO call SessionManager
 */

(function () {
    'use strict';

    console.log('[Logout Interceptor] Installing...');

    // Wait for main.js to load and expose the AccountManager
    const maxAttempts = 100; // 10 seconds
    let attempts = 0;

    const hookLogout = setInterval(() => {
        attempts++;

        // Try to find React's AccountManager (exposed globally or via window)
        // The AccountManager has a logout() method that React calls

        // Strategy 1: Look for global objects that might have logout
        const possiblePaths = [
            'window.AccountManager?.shared?.logout',
            'window.UserManager?.shared?.logout',
            'window.SessionManager?.logout'
        ];

        let foundAccountManager = false;

        // Check if SessionManager exists (our custom one)
        if (window.SessionManager && window.SessionManager.logout) {
            console.log('[Logout Interceptor] ✅ SessionManager found');

            // Now we need to find React's AccountManager
            // It's exposed as a module, so we need to wait for main.js to fully load

            // Strategy: Intercept document.cookie setter to catch logout
            const originalCookieSetter = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie').set;

            Object.defineProperty(document, 'cookie', {
                set: function (value) {
                    // Check if this is a logout operation (clearing ACCT cookie)
                    if (value.includes('ACCT=;') || value.includes('ACCT=""')) {
                        console.log('[Logout Interceptor] 🎯 Detected React logout (ACCT cookie cleared)');

                        // Call our SessionManager logout
                        // Use setTimeout to let React finish its logout first
                        setTimeout(() => {
                            if (window.SessionManager && window.SessionManager.logout) {
                                console.log('[Logout Interceptor] 🔄 Triggering SessionManager cleanup...');
                                window.SessionManager.logout();
                            }
                        }, 100);
                    }

                    // Call original setter
                    originalCookieSetter.call(this, value);
                },
                get: Object.getOwnPropertyDescriptor(Document.prototype, 'cookie').get
            });

            console.log('[Logout Interceptor] ✅ Cookie setter intercepted');
            console.log('[Logout Interceptor] 🚀 Will trigger SessionManager when React logs out');

            clearInterval(hookLogout);
            foundAccountManager = true;
        }

        if (!foundAccountManager && attempts >= maxAttempts) {
            console.error('[Logout Interceptor] ❌ Could not hook into logout after 10s');
            clearInterval(hookLogout);
        }

    }, 100);

})();
