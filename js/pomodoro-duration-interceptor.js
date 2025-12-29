/**
 * Pomodoro Duration Interceptor
 * Ensures all completed pomodoros have duration, startTime, and endTime fields
 */
(function () {
    'use strict';

    console.log('[Pomodoro Interceptor] Installing duration field injector...');

    // Track pomodoro start times
    const pomodoroStartTimes = new Map();

    // Intercept IndexedDB writes to Pomodoro store
    const originalPut = IDBObjectStore.prototype.put;

    IDBObjectStore.prototype.put = function (value, key) {
        // Only intercept Pomodoro store
        if (this.name === 'Pomodoro' && value && value.id) {
            // ✅ CRITICAL FIX: Skip if this is a hydration write (already has valid duration)
            // Only track NEW pomodoros that are being created by the timer
            // We prioritize duration > 0 as the source of truth, even if startTime is default/0
            if (value.duration && value.duration > 0) {
                console.log(`[Pomodoro Interceptor] ⏭️ Skipping hydration write for ${value.id.substring(0, 8)} (duration: ${value.duration}ms)`);
                return originalPut.call(this, value, key);
            }

            const now = Date.now();

            // If this is a new pomodoro without duration fields, add them
            if (value.duration === undefined || value.duration === 0) {
                // Check if we have a start time for this pomodoro
                let startTime = pomodoroStartTimes.get(value.id);

                if (!startTime) {
                    // This is a new pomodoro starting
                    startTime = now;
                    pomodoroStartTimes.set(value.id, startTime);
                    console.log(`[Pomodoro Interceptor] 🕐 Started tracking pomodoro: ${value.id.substring(0, 8)}`);
                }

                // Calculate duration (default to 25 minutes if just starting)
                const endTime = now;
                const duration = endTime - startTime;

                // Only set duration if it's reasonable (> 0 and < 2 hours)
                if (duration > 0 && duration < 7200000) {
                    value.duration = duration;
                    value.startTime = startTime;
                    value.endTime = endTime;

                    const minutes = Math.floor(duration / 60000);
                    console.log(`[Pomodoro Interceptor] ✅ Added duration fields: ${minutes}m (${duration}ms)`);

                    // Clean up tracking
                    pomodoroStartTimes.delete(value.id);
                } else {
                    // Set defaults for new pomodoro
                    value.duration = value.duration || 0;
                    value.startTime = value.startTime || startTime;
                    value.endTime = value.endTime || 0;
                }
            }
        }

        return originalPut.call(this, value, key);
    };

    console.log('[Pomodoro Interceptor] ✅ Duration field injector installed');
})();
