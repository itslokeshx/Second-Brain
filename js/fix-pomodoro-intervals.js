(function () {
    'use strict';



    window.fixPomodoroIntervals = function () {


        const DEFAULT_INTERVAL = 1500; // 25 minutes in seconds

        // Fix localStorage
        const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
        let fixedCount = 0;

        tasks.forEach(task => {
            if (!task.pomodoroInterval || task.pomodoroInterval !== DEFAULT_INTERVAL) {
                const oldInterval = task.pomodoroInterval || 0;
                task.pomodoroInterval = DEFAULT_INTERVAL;
                fixedCount++;
            }
        });

        if (fixedCount > 0) {
            localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));

            // Dispatch storage event to trigger UI update
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'pomodoro-tasks',
                newValue: JSON.stringify(tasks),
                url: window.location.href
            }));

        }

        // Fix IndexedDB
        const userId = localStorage.getItem('userId');
        if (!userId) {

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

                };
            };
        };

        request.onerror = function () {
            console.error('❌ Failed to open IndexedDB');
        };
    };
})();
