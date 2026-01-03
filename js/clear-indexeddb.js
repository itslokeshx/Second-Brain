// Clear Old IndexedDB - Force main.js to use localStorage
(function () {
    'use strict';

    // console.log('[IndexedDB Cleaner] Deleting old database...');

    const dbName = 'PomodoroDB6';
    const deleteRequest = indexedDB.deleteDatabase(dbName);

    deleteRequest.onsuccess = function () {
        // console.log('[IndexedDB Cleaner] ✅ Old database deleted successfully');
        // console.log('[IndexedDB Cleaner] main.js will now read from localStorage');
    };

    deleteRequest.onerror = function (event) {
        console.error('[IndexedDB Cleaner] ❌ Failed to delete database:', event);
    };

    deleteRequest.onblocked = function () {
        console.warn('[IndexedDB Cleaner] ⚠️ Database deletion blocked - close all tabs and try again');
    };
})();
