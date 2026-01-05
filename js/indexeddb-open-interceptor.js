(function () {
    'use strict';


    // Store original open function
    const originalOpen = indexedDB.open.bind(indexedDB);

    // Override indexedDB.open
    indexedDB.open = function (name, version) {
        // If opening PomodoroDB6 (hardcoded in main.js), redirect to user-scoped DB
        if (name === 'PomodoroDB6') {
            let userId = null;

            // Try to get userId from UserDB helper
            if (window.UserDB) {
                try {
                    userId = window.UserDB.getCurrentUserId();
                } catch (error) {
                    console.warn('[IDB Interceptor] UserDB.getCurrentUserId() failed:', error);
                }
            }

            // Fallback: try localStorage directly
            if (!userId) {
                userId = localStorage.getItem('userId');
                if (userId) {
                }
            }

            if (userId && userId !== 'undefined' && userId !== 'null') {
                const userDBName = 'PomodoroDB6_' + userId;
                return originalOpen(userDBName, version);
            } else {
                console.warn('[IDB Interceptor] ⚠️ NO USER ID AVAILABLE - using original DB!');
                console.warn('[IDB Interceptor] This may cause data to go to wrong database!');
            }
        }

        // For all other databases, use original
        return originalOpen(name, version);
    };


})();
