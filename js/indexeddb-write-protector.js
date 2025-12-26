/**
 * IndexedDB Write Protector
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL: Prevents main.js from overwriting dirty tasks (sync: 0)
 * 
 * Problem: main.js listens to storage events and re-writes tasks from localStorage
 * to IndexedDB. But localStorage might have stale data, causing dirty tasks to be
 * overwritten with sync=1 versions.
 * 
 * Solution: Intercept IDBObjectStore.put() and check if we're about to overwrite
 * a dirty task. If so, preserve the dirty version.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    console.log('[Write Protector] Installing dirty task protection...');

    const originalPut = IDBObjectStore.prototype.put;

    IDBObjectStore.prototype.put = function (value, key) {
        // Only protect Task store
        if (this.name === 'Task' && value && value.id) {
            // Check if we're about to overwrite a dirty task
            const getReq = this.get(value.id);

            getReq.onsuccess = () => {
                const existingTask = getReq.result;

                if (existingTask && existingTask.sync === 0 && value.sync !== 0) {
                    // BLOCK: Attempting to overwrite dirty task with clean version
                    console.warn(`[Write Protector] 🛡️ BLOCKED overwrite of dirty task "${existingTask.name}" (sync:0 → sync:${value.sync})`);
                    // Don't call originalPut - just return a fake success
                    return;
                }

                // Safe to write
                originalPut.call(this, value, key);
            };

            getReq.onerror = () => {
                // If read fails, allow write (task doesn't exist yet)
                originalPut.call(this, value, key);
            };

            // Return a fake request that will be resolved by the getReq callback
            return {
                result: undefined,
                error: null,
                source: this,
                transaction: this.transaction,
                readyState: 'done',
                onsuccess: null,
                onerror: null
            };
        }

        // Not a Task store or no ID - allow write
        return originalPut.call(this, value, key);
    };

    console.log('[Write Protector] ✅ Dirty task protection installed');

})();
