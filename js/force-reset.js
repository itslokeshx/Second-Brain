// Force Reset - One-time script to wipe corrupted local data
(function () {
    'use strict';

    // Check if we've already reset
    if (localStorage.getItem('force_reset_v1')) {
        return;
    }

    console.warn('[Force Reset] 🧹 Wiping all local data to fix corruption...');

    try {
        // Clear localStorage
        localStorage.clear();

        // Clear IndexedDB (used by legacy main.js)
        const dbs = ['focustodo', 'localforage'];
        dbs.forEach(dbName => {
            const req = indexedDB.deleteDatabase(dbName);

        });

        // Set flag so we don't do this every time
        localStorage.setItem('force_reset_v1', 'true');


        // Force reload to apply clean slate
        setTimeout(() => location.reload(), 1000);

    } catch (e) {
        console.error('[Force Reset] Error during cleanup:', e);
    }
})();
