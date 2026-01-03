/**
 * IndexedDB Write Protector
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL: Prevents main.js from overwriting dirty tasks/projects (sync: 0)
 * while still allowing UI updates to happen
 * 
 * Problem: main.js listens to storage events and re-writes tasks from localStorage
 * to IndexedDB. But localStorage might have stale data, causing dirty tasks to be
 * overwritten with sync=1 versions.
 * 
 * Solution: Intercept IDBObjectStore.put() and check if we're about to overwrite
 * a dirty task. If so, preserve the dirty version BUT still trigger success callback
 * so the UI updates.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';


    const originalPut = IDBObjectStore.prototype.put;

    IDBObjectStore.prototype.put = function (value, key) {
        const store = this;

        // Protect both Task and Project stores
        if ((this.name === 'Task' || this.name === 'Project') && value && value.id) {
            // Create a fake request that we'll control
            const fakeRequest = {
                result: value.id,
                error: null,
                source: store,
                transaction: store.transaction,
                readyState: 'pending',
                onsuccess: null,
                onerror: null
            };

            // Check if we're about to overwrite a dirty item
            const getReq = store.get(value.id);

            getReq.onsuccess = () => {
                const existingItem = getReq.result;

                if (existingItem && existingItem.sync === 0 && value.sync !== 0) {
                    // PRESERVE: Keep the dirty version, but pretend write succeeded
                    const itemType = this.name === 'Task' ? 'task' : 'project';

                    // Trigger success callback so UI updates
                    fakeRequest.readyState = 'done';
                    if (fakeRequest.onsuccess) {
                        setTimeout(() => {
                            fakeRequest.onsuccess({ target: fakeRequest });
                        }, 0);
                    }
                } else {
                    // Safe to write - do the actual put
                    const realReq = originalPut.call(store, value, key);

                    // Forward callbacks to real request
                    realReq.onsuccess = (e) => {
                        fakeRequest.result = realReq.result;
                        fakeRequest.readyState = 'done';
                        if (fakeRequest.onsuccess) {
                            fakeRequest.onsuccess(e);
                        }
                    };

                    realReq.onerror = (e) => {
                        fakeRequest.error = realReq.error;
                        fakeRequest.readyState = 'done';
                        if (fakeRequest.onerror) {
                            fakeRequest.onerror(e);
                        }
                    };
                }
            };

            getReq.onerror = () => {
                // If read fails, allow write (item doesn't exist yet)
                const realReq = originalPut.call(store, value, key);

                realReq.onsuccess = (e) => {
                    fakeRequest.result = realReq.result;
                    fakeRequest.readyState = 'done';
                    if (fakeRequest.onsuccess) {
                        fakeRequest.onsuccess(e);
                    }
                };

                realReq.onerror = (e) => {
                    fakeRequest.error = realReq.error;
                    fakeRequest.readyState = 'done';
                    if (fakeRequest.onerror) {
                        fakeRequest.onerror(e);
                    }
                };
            };

            return fakeRequest;
        }

        // Not a protected store or no ID - allow write
        return originalPut.call(this, value, key);
    };


})();
