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
        // console.log('[Force Reset] localStorage cleared.');

        // Clear IndexedDB (used by legacy main.js)
        const dbs = ['focustodo', 'localforage'];
        dbs.forEach(dbName => {
            const req = indexedDB.deleteDatabase(dbName);
            req.onsuccess = () => console.log(`[Force Reset] Deleted DB: ${dbName}`);
            req.onerror = () => console.error(`[Force Reset] Failed to delete DB: ${dbName}`);
        });

        // Set flag so we don't do this every time
        localStorage.setItem('force_reset_v1', 'true');

        // console.log('[Force Reset] ✅ Cleanup complete. Reloading...');

        // Force reload to apply clean slate
        setTimeout(() => location.reload(), 1000);

    } catch (e) {
        console.error('[Force Reset] Error during cleanup:', e);
    }
})();
