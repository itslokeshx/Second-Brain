// Main.js Patcher - Fix garbled username display
// This patches React's AccountManager to provide username without reading NAME cookie
(function () {
    'use strict';

    console.log('[Main Patcher] Installing username display fix...');

    // Wait for main.js to load and AccountManager to be available
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds

    const patchInterval = setInterval(() => {
        attempts++;

        // Look for AccountManager in window or common React locations
        let accountManager = null;

        // Try to find AccountManager
        if (window.AccountManager) {
            accountManager = window.AccountManager;
        } else if (window.m?.default) {
            accountManager = window.m.default;
        }

        if (accountManager && accountManager.shared) {
            console.log('[Main Patcher] ✅ Found AccountManager');
            clearInterval(patchInterval);

            // Patch the 'name' property getter
            const originalDescriptor = Object.getOwnPropertyDescriptor(accountManager.shared, 'name');

            Object.defineProperty(accountManager.shared, 'name', {
                get: function () {
                    // Get username from ACCT cookie (not NAME cookie)
                    const cookies = document.cookie.split(';');
                    const acctCookie = cookies.find(c => c.trim().startsWith('ACCT='));

                    if (acctCookie) {
                        const username = acctCookie.split('=')[1].trim();
                        console.log('[Main Patcher] 📝 Providing username:', username);
                        return username;
                    }

                    // Fallback to original if available
                    if (originalDescriptor && originalDescriptor.get) {
                        return originalDescriptor.get.call(this);
                    }

                    return 'User';
                },
                set: function (value) {
                    // Allow setting if needed
                    if (originalDescriptor && originalDescriptor.set) {
                        originalDescriptor.set.call(this, value);
                    }
                },
                configurable: true
            });

            console.log('[Main Patcher] ✅ Username display patched - using ACCT cookie');
            return;
        }

        if (attempts >= maxAttempts) {
            console.error('[Main Patcher] ❌ Could not find AccountManager after 10s');
            clearInterval(patchInterval);
        }
    }, 100);

})();
