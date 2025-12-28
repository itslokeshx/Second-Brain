/**
 * Logout Interceptor - Immediate logout on Sign Out click
 * 
 * PROBLEM: React's logout dialog only exists after first sync
 * SOLUTION: Bypass React's dialog and trigger logout immediately
 */

(function () {
    'use strict';

    console.log('[Logout Interceptor] Installing...');

    // Wait for SessionManager to be ready
    const maxAttempts = 50; // 5 seconds
    let attempts = 0;

    const interceptLogout = setInterval(() => {
        attempts++;

        // Check if SessionManager is ready
        if (!window.SessionManager || !window.SessionManager.logout) {
            if (attempts >= maxAttempts) {
                console.error('[Logout Interceptor] ❌ SessionManager not found after 5s');
                clearInterval(interceptLogout);
            }
            return;
        }

        // SUCCESS: Found SessionManager
        console.log('[Logout Interceptor] ✅ SessionManager found');
        clearInterval(interceptLogout);

        // IMMEDIATE LOGOUT: Intercept Sign Out clicks and logout immediately
        // Don't wait for React's dialog (which only exists after first sync)
        document.body.addEventListener('click', (e) => {
            const text = e.target.textContent?.trim();
            const parentText = e.target.parentElement?.textContent?.trim();

            if (text === 'Sign Out' || parentText === 'Sign Out' ||
                text === 'Logout' || parentText === 'Logout') {

                // Check if this is inside the user dropdown menu
                const isInDropdown = e.target.closest('[class*="UserDropdownMenu"], [class*="UserMenu"]');

                if (isInDropdown) {
                    console.log('[Logout Interceptor] 🎯 Sign Out clicked - IMMEDIATE LOGOUT');

                    // STOP ALL EVENT PROPAGATION
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    // Close the dropdown menu
                    const dropdown = e.target.closest('[class*="UserDropdownMenu"]');
                    if (dropdown) {
                        dropdown.style.display = 'none';
                    }

                    // Call logout directly - bypass React's dialog
                    window.SessionManager.logout();

                    return false;
                }
            }
        }, true); // Use capture phase to intercept BEFORE React

        console.log('[Logout Interceptor] ✅ Immediate logout interceptor installed');
        console.log('[Logout Interceptor] 🚀 Ready - logout works without sync');

    }, 100);

})();
