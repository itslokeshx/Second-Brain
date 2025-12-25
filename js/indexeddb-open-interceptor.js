/**
 * IndexedDB Open Interceptor
 * ═══════════════════════════════════════════════════════════════════════════
 * Intercepts all indexedDB.open() calls and redirects them to user-scoped DB
 * 
 * This ensures main.js (which has hardcoded 'PomodoroDB6') writes to the
 * correct user-scoped database: PomodoroDB6_{userId}
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    console.log('[IDB Interceptor] Installing indexedDB.open() interceptor...');

    // Store original open function
    const originalOpen = indexedDB.open.bind(indexedDB);

    // Override indexedDB.open
    indexedDB.open = function(name, version) {
        // If opening PomodoroDB6 (hardcoded in main.js), redirect to user-scoped DB
        if (name === 'PomodoroDB6' && window.UserDB) {
            try {
                const userId = window.UserDB.getCurrentUserId();
                if (userId) {
                    const userDBName = window.UserDB.getDBName();
                    console.log('[IDB Interceptor] Redirecting', name, '→', userDBName);
                    return originalOpen(userDBName, version);
                }
            } catch (error) {
                // No user or error - use original
                console.log('[IDB Interceptor] No user, using original DB');
            }
        }

        // For all other databases, use original
        return originalOpen(name, version);
    };

    console.log('[IDB Interceptor] ✅ Installed - all PomodoroDB6 opens redirected to user-scoped DB');

})();
