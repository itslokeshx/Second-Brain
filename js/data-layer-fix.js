/**
 * DATA LAYER FIX
 * 
 * Ensures new tasks get reasonable default values for estimatePomoNum
 * Prevents NaN at the source by ensuring data integrity
 */

(function () {
    'use strict';

    console.log('[Data Fix] Loading data integrity patches...');

    // Patch IndexedDB put operations to set defaults
    const originalIDBPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, key) {
        // Only patch Task store
        if (this.name === 'Task' && value && typeof value === 'object') {
            // Set default estimatePomoNum if missing or zero
            if (!value.estimatePomoNum || value.estimatePomoNum === 0) {
                value.estimatePomoNum = 2; // Default to 2 pomodoros (50 minutes)
                console.log('[Data Fix] Set default estimatePomoNum=2 for task:', value.name);
            }

            // Ensure pomodoroInterval is set
            if (!value.pomodoroInterval) {
                value.pomodoroInterval = 1500; // 25 minutes in seconds
                console.log('[Data Fix] Set default pomodoroInterval=1500 for task:', value.name);
            }

            // Ensure estimatedTime is calculated
            if (!value.estimatedTime || value.estimatedTime === 0) {
                value.estimatedTime = value.estimatePomoNum * value.pomodoroInterval;
                console.log('[Data Fix] Calculated estimatedTime for task:', value.name, '=', value.estimatedTime);
            }

            // Sanitize any NaN values
            Object.keys(value).forEach(k => {
                if (typeof value[k] === 'number' && isNaN(value[k])) {
                    console.warn('[Data Fix] Sanitized NaN value for', k, 'in task:', value.name);
                    value[k] = 0;
                }
            });
        }

        return originalIDBPut.call(this, value, key);
    };

    // Patch localStorage setItem to sanitize task data
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
        if (key === 'pomodoro-tasks' && value) {
            try {
                const tasks = JSON.parse(value);
                if (Array.isArray(tasks)) {
                    tasks.forEach(task => {
                        // Set defaults for missing values
                        if (!task.estimatePomoNum || task.estimatePomoNum === 0) {
                            task.estimatePomoNum = 2;
                        }
                        if (!task.pomodoroInterval) {
                            task.pomodoroInterval = 1500;
                        }
                        if (!task.estimatedTime || task.estimatedTime === 0) {
                            task.estimatedTime = task.estimatePomoNum * task.pomodoroInterval;
                        }

                        // Sanitize NaN
                        Object.keys(task).forEach(k => {
                            if (typeof task[k] === 'number' && isNaN(task[k])) {
                                task[k] = 0;
                            }
                        });
                    });
                    value = JSON.stringify(tasks);
                }
            } catch (e) {
                console.warn('[Data Fix] Could not parse tasks:', e);
            }
        }

        return originalSetItem.call(this, key, value);
    };

    // Fix existing tasks in localStorage
    function fixExistingTasks() {
        try {
            const tasksStr = localStorage.getItem('pomodoro-tasks');
            if (!tasksStr) return;

            const tasks = JSON.parse(tasksStr);
            let fixed = 0;

            tasks.forEach(task => {
                let taskFixed = false;

                if (!task.estimatePomoNum || task.estimatePomoNum === 0) {
                    task.estimatePomoNum = 2;
                    taskFixed = true;
                }
                if (!task.pomodoroInterval) {
                    task.pomodoroInterval = 1500;
                    taskFixed = true;
                }
                if (!task.estimatedTime || task.estimatedTime === 0) {
                    task.estimatedTime = task.estimatePomoNum * task.pomodoroInterval;
                    taskFixed = true;
                }

                // Sanitize NaN
                Object.keys(task).forEach(k => {
                    if (typeof task[k] === 'number' && isNaN(task[k])) {
                        task[k] = 0;
                        taskFixed = true;
                    }
                });

                if (taskFixed) fixed++;
            });

            if (fixed > 0) {
                localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));
                console.log('[Data Fix] ✅ Fixed', fixed, 'existing tasks');

                // Dispatch storage event to trigger React update
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'pomodoro-tasks',
                    newValue: localStorage.getItem('pomodoro-tasks'),
                    url: window.location.href,
                    storageArea: localStorage
                }));
            }
        } catch (error) {
            console.error('[Data Fix] Error fixing existing tasks:', error);
        }
    }

    // Run fix on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixExistingTasks);
    } else {
        fixExistingTasks();
    }

    console.log('[Data Fix] ✅ Data integrity patches active');
    console.log('[Data Fix] ✅ Default values will be set for new tasks');
})();
