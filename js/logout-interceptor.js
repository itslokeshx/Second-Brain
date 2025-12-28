/**
 * Logout Interceptor - Hooks into React's logout to trigger SessionManager
 * 
 * PROBLEM: React's logout button calls internal logout functions in main.js
 * which don't trigger our SessionManager.logout(). This script monkey-patches
 * those functions to ensure our logout logic runs.
 */

(function () {
    'use strict';

    console.log('[Logout Interceptor] Installing...');

    // Wait for main.js to load and define the logout functions
    const maxAttempts = 50; // 5 seconds
    let attempts = 0;

    const interceptLogout = setInterval(() => {
        attempts++;

        // Try to find the global logout functions that React uses
        // These are typically exposed on window or in global scope

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

        // STRATEGY: Intercept ALL possible logout triggers

        // 1. Intercept any global logout function
        if (typeof window.logout === 'function') {
            const originalLogout = window.logout;
            window.logout = function () {
                console.log('[Logout Interceptor] 🎯 Global logout() intercepted');
                window.SessionManager.logout();
                // Don't call original to prevent duplicate logout
            };
            console.log('[Logout Interceptor] ✅ Hooked window.logout()');
        }

        // 2. Create a MutationObserver to watch for logout dialog
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if this is a logout confirmation dialog
                        const confirmButton = node.querySelector('[class*="confirm"], button');
                        if (confirmButton && node.textContent &&
                            (node.textContent.includes('Sign Out') ||
                                node.textContent.includes('Logout') ||
                                node.textContent.includes('logout'))) {

                            console.log('[Logout Interceptor] 🔍 Logout dialog detected');

                            // Intercept the confirm button click
                            const originalClick = confirmButton.onclick;
                            confirmButton.onclick = function (e) {
                                console.log('[Logout Interceptor] 🎯 Logout confirmed via dialog');
                                window.SessionManager.logout();
                                // Prevent original handler
                                e.stopPropagation();
                                e.preventDefault();
                                return false;
                            };
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[Logout Interceptor] ✅ Dialog observer installed');

        // 3. NUCLEAR OPTION: Intercept ALL clicks on "Sign Out" text
        document.body.addEventListener('click', (e) => {
            const text = e.target.textContent?.trim();
            const parentText = e.target.parentElement?.textContent?.trim();

            if (text === 'Sign Out' || parentText === 'Sign Out' ||
                text === 'Logout' || parentText === 'Logout') {

                // Check if this is inside the user dropdown menu
                const isInDropdown = e.target.closest('[class*="UserDropdownMenu"], [class*="UserMenu"]');

                if (isInDropdown) {
                    console.log('[Logout Interceptor] 🎯 Sign Out clicked in dropdown');

                    // Small delay to let React show its dialog first
                    setTimeout(() => {
                        // Find and intercept the confirmation dialog
                        const dialogs = document.querySelectorAll('[class*="Dialog"], [class*="Modal"], [role="dialog"]');
                        dialogs.forEach(dialog => {
                            if (dialog.textContent.includes('Sign Out') || dialog.textContent.includes('logout')) {
                                const confirmBtn = dialog.querySelector('button[class*="confirm"], button:last-of-type');
                                if (confirmBtn) {
                                    const originalHandler = confirmBtn.onclick;
                                    confirmBtn.onclick = function (e) {
                                        console.log('[Logout Interceptor] 🎯 Intercepted confirm button');
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.SessionManager.logout();
                                        return false;
                                    };
                                }
                            }
                        });
                    }, 100);
                }
            }
        }, true); // Use capture phase

        console.log('[Logout Interceptor] ✅ Click interceptor installed');
        console.log('[Logout Interceptor] 🚀 All hooks active');

    }, 100);

})();
