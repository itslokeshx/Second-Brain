// ═══════════════════════════════════════════════════════════════════════
// 🔧 POMODORO INTERVAL FIX
// ═══════════════════════════════════════════════════════════════════════
// 
// This script normalizes all tasks to have the default 25-minute pomodoro interval
// Run this in the browser console to fix tasks with incorrect intervals
// ═══════════════════════════════════════════════════════════════════════

(function () {
    'use strict';

    // console.log('[Pomo Interval Fix] 📦 Loaded');
    // console.log('[Pomo Interval Fix] Run window.fixPomodoroIntervals() to normalize all task intervals to 25 minutes');

    window.fixPomodoroIntervals = function () {
        // console.log('═══════════════════════════════════════════════════════════');
        // console.log('🔧 FIXING POMODORO INTERVALS');
        // console.log('═══════════════════════════════════════════════════════════\n');

        const DEFAULT_INTERVAL = 1500; // 25 minutes in seconds

        // Fix localStorage
        const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
        let fixedCount = 0;

        tasks.forEach(task => {
            if (!task.pomodoroInterval || task.pomodoroInterval !== DEFAULT_INTERVAL) {
                const oldInterval = task.pomodoroInterval || 0;
                task.pomodoroInterval = DEFAULT_INTERVAL;
                // console.log(`✅ Fixed task "${task.name}": ${oldInterval}s → ${DEFAULT_INTERVAL}s`);
                fixedCount++;
            }
        });

        if (fixedCount > 0) {
            localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));
            // console.log(`\n✅ Fixed ${fixedCount} task(s) in localStorage`);

            // Dispatch storage event to trigger UI update
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'pomodoro-tasks',
                newValue: JSON.stringify(tasks),
                url: window.location.href
            }));

            // console.log('✅ Dispatched storage event to update UI');
        } else {
            // console.log('\n✅ All tasks already have correct intervals (1500s = 25min)');
        }

        // Fix IndexedDB
        // console.log('\n🔄 Fixing IndexedDB...');

        const userId = localStorage.getItem('userId');
        if (!userId) {
            console.error('❌ No userId found in localStorage');
            // console.log('💡 localStorage was fixed, but IndexedDB requires userId');
            // console.log('🔄 Please refresh the page to complete the fix');
            return;
        }

        const dbName = `PomodoroDB6_${userId}`;
        const request = indexedDB.open(dbName);

        request.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction(['Task'], 'readwrite');
            const store = transaction.objectStore('Task');
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = function () {
                const idbTasks = getAllRequest.result;
                let idbFixedCount = 0;

                idbTasks.forEach(task => {
                    if (!task.pomodoroInterval || task.pomodoroInterval !== DEFAULT_INTERVAL) {
                        task.pomodoroInterval = DEFAULT_INTERVAL;
                        store.put(task);
                        idbFixedCount++;
                    }
                });

                transaction.oncomplete = function () {
                    // console.log(`✅ Fixed ${idbFixedCount} task(s) in IndexedDB`);
                    // console.log('\n═══════════════════════════════════════════════════════════');
                    // console.log('✅ ALL FIXES COMPLETE');
                    // console.log('🔄 Please refresh the page to see changes');
                    // console.log('═══════════════════════════════════════════════════════════\n');
                };
            };
        };

        request.onerror = function () {
            console.error('❌ Failed to open IndexedDB');
        };
    };
})();
