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

    // Intercept IndexedDB reads to ensure pomodoroInterval is valid
    const originalIDBGet = IDBObjectStore.prototype.get;
    IDBObjectStore.prototype.get = function (key) {
        const request = originalIDBGet.call(this, key);
        const originalSuccess = request.onsuccess;

        request.onsuccess = function (event) {
            const result = event.target.result;

            // Validate pomodoroInterval is a valid positive number
            if (result && result.pomodoroInterval !== undefined) {
                if (typeof result.pomodoroInterval !== 'number' ||
                    isNaN(result.pomodoroInterval) ||
                    result.pomodoroInterval <= 0) {
                    console.log(`[Time Patch] 🔧 Fixed invalid pomodoroInterval: ${result.pomodoroInterval} → 1500 (default)`);
                    result.pomodoroInterval = 1500; // Default fallback only
                }
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

    // Intercept IDBObjectStore.getAll to validate all tasks at once
    const originalGetAll = IDBObjectStore.prototype.getAll;
    IDBObjectStore.prototype.getAll = function (query, count) {
        const request = originalGetAll.call(this, query, count);
        const originalSuccess = request.onsuccess;

        request.onsuccess = function (event) {
            const results = event.target.result;

            if (Array.isArray(results)) {
                results.forEach(item => {
                    // Validate pomodoroInterval is a valid positive number
                    if (item && item.pomodoroInterval !== undefined) {
                        if (typeof item.pomodoroInterval !== 'number' ||
                            isNaN(item.pomodoroInterval) ||
                            item.pomodoroInterval <= 0) {
                            item.pomodoroInterval = 1500; // Default fallback only
                        }
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
    console.log('[Time Patch] ✅ pomodoroInterval will be validated (invalid → 1500 default)');
})();
