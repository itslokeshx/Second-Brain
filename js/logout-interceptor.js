/**
 * Logout Interceptor - Let React handle the dialog, hook the logout function
 * 
 * STRATEGY: 
 * 1. Let React show its beautiful logout dialog naturally
 * 2. When user confirms, React calls AccountManager.logout()
 * 3. We detect this and ALSO call SessionManager.logout()
 */

(function () {
    'use strict';


    // Wait for main.js to load
    const maxAttempts = 100; // 10 seconds
    let attempts = 0;

    const hookLogout = setInterval(() => {
        attempts++;

        // Check if SessionManager is ready
        if (!window.SessionManager || !window.SessionManager.logout) {
            if (attempts >= maxAttempts) {
                console.error('[Logout Interceptor] ❌ SessionManager not found after 10s');
                clearInterval(hookLogout);
            }
            return;
        }

        clearInterval(hookLogout);

        // STRATEGY: Detect when React's AccountManager clears cookies
        // This happens when the user confirms the logout dialog

        const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
        const originalCookieSetter = originalCookieDescriptor.set;

        let logoutDetected = false;

        Object.defineProperty(document, 'cookie', {
            set: function (value) {
                // Detect React's logout by watching for ACCT cookie being cleared
                if (value.includes('ACCT=') && (value.includes('ACCT=""') || value.includes('ACCT=;'))) {
                    if (!logoutDetected) {
                        logoutDetected = true;

                        // Let React finish its logout first, then call ours
                        setTimeout(() => {
                            if (window.SessionManager && window.SessionManager.logout) {
                                window.SessionManager.logout();
                            }
                        }, 100);
                    }
                }

                // Call original setter
                return originalCookieSetter.call(this, value);
            },
            get: originalCookieDescriptor.get,
            configurable: true
        });



    }, 100);

})();
