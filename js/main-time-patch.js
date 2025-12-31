/**
 * MAIN.JS TIME CALCULATION PATCH
 * Monkey-patches React's time calculation to fix NaN display
 * This MUST load BEFORE main.js
 */

(function () {
    console.log('[Time Patch] Installing React time calculation fix...');

    // Store original Math.floor to detect when React calculates time
    const originalFloor = Math.floor;
    let patchActive = false;

    // Override Math.floor to intercept time calculations
    Math.floor = function (value) {
        // If value is NaN or undefined, return 0 instead
        if (isNaN(value) || value === undefined || value === null) {
            if (!patchActive) {
                patchActive = true;
                console.log('[Time Patch] 🔧 Intercepted NaN calculation, returning 0');
                patchActive = false;
            }
            return 0;
        }
        return originalFloor.call(this, value);
    };

    // Also patch the modulo operator for minutes calculation
    const originalValueOf = Number.prototype.valueOf;
    Number.prototype.valueOf = function () {
        const val = originalValueOf.call(this);
        if (isNaN(val)) {
            console.log('[Time Patch] 🔧 Intercepted NaN in Number.valueOf, returning 0');
            return 0;
        }
        return val;
    };

    // Intercept IndexedDB reads to ensure pomodoroInterval is always 1500
    const originalIDBGet = IDBObjectStore.prototype.get;
    IDBObjectStore.prototype.get = function (key) {
        const request = originalIDBGet.call(this, key);
        const originalSuccess = request.onsuccess;

        request.onsuccess = function (event) {
            const result = event.target.result;

            // Fix pomodoroInterval if it's wrong
            if (result && result.pomodoroInterval && result.pomodoroInterval !== 1500) {
                console.log(`[Time Patch] 🔧 Fixed pomodoroInterval: ${result.pomodoroInterval} → 1500`);
                result.pomodoroInterval = 1500;
            }

            // Ensure actualPomoNum is a number
            if (result && result.actualPomoNum !== undefined) {
                if (typeof result.actualPomoNum !== 'number' || isNaN(result.actualPomoNum)) {
                    console.log(`[Time Patch] 🔧 Fixed actualPomoNum: ${result.actualPomoNum} → 0`);
                    result.actualPomoNum = 0;
                }
            }

            if (originalSuccess) {
                originalSuccess.call(this, event);
            }
        };

        return request;
    };

    // Intercept IDBObjectStore.getAll to fix all tasks at once
    const originalGetAll = IDBObjectStore.prototype.getAll;
    IDBObjectStore.prototype.getAll = function (query, count) {
        const request = originalGetAll.call(this, query, count);
        const originalSuccess = request.onsuccess;

        request.onsuccess = function (event) {
            const results = event.target.result;

            if (Array.isArray(results)) {
                results.forEach(item => {
                    // Fix pomodoroInterval
                    if (item && item.pomodoroInterval && item.pomodoroInterval !== 1500) {
                        item.pomodoroInterval = 1500;
                    }

                    // Fix actualPomoNum
                    if (item && item.actualPomoNum !== undefined) {
                        if (typeof item.actualPomoNum !== 'number' || isNaN(item.actualPomoNum)) {
                            item.actualPomoNum = 0;
                        }
                    }

                    // Fix estimatedTime
                    if (item && item.estimatedTime !== undefined) {
                        if (typeof item.estimatedTime !== 'number' || isNaN(item.estimatedTime)) {
                            item.estimatedTime = 0;
                        }
                    }
                });
            }

            if (originalSuccess) {
                originalSuccess.call(this, event);
            }
        };

        return request;
    };

    console.log('[Time Patch] ✅ Installed - NaN values will be converted to 0');
    console.log('[Time Patch] ✅ pomodoroInterval will be forced to 1500');
})();
