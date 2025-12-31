/**
 * EMERGENCY FIX: Repair missing taskId in pomodoro logs
 * This script will attempt to reconstruct missing taskId references
 */

(async function () {
    console.log('[EMERGENCY FIX] Starting pomodoro taskId repair...');

    // Open IndexedDB
    const dbName = `PomodoroDB6_${document.cookie.match(/UID=([^;]+)/)?.[1]}`;
    const request = indexedDB.open(dbName, 2);

    request.onsuccess = async function (event) {
        const db = event.target.result;

        // Get all pomodoros and tasks
        const tx = db.transaction(['Pomodoro', 'Task'], 'readwrite');
        const pomoStore = tx.objectStore('Pomodoro');
        const taskStore = tx.objectStore('Task');

        const pomos = await new Promise(resolve => {
            const req = pomoStore.getAll();
            req.onsuccess = () => resolve(req.result);
        });

        const tasks = await new Promise(resolve => {
            const req = taskStore.getAll();
            req.onsuccess = () => resolve(req.result);
        });

        console.log(`[EMERGENCY FIX] Found ${pomos.length} pomodoros, ${tasks.length} tasks`);

        let fixed = 0;
        let orphaned = 0;

        for (const pomo of pomos) {
            if (!pomo.taskId || pomo.taskId === '') {
                // Try to find the task by matching time ranges
                const matchingTask = tasks.find(t => {
                    // Check if pomodoro time falls within task creation/finish window
                    const pomoTime = pomo.startTime || pomo.endTime;
                    return pomoTime >= (t.creationDate || 0) &&
                        (!t.finishedDate || pomoTime <= t.finishedDate);
                });

                if (matchingTask) {
                    console.log(`[EMERGENCY FIX] Linking orphaned pomo ${pomo.id.substring(0, 8)} to task "${matchingTask.name}"`);
                    pomo.taskId = matchingTask.id;
                    pomo.sync = 0; // Mark as dirty to re-sync
                    pomoStore.put(pomo);
                    fixed++;
                } else {
                    console.warn(`[EMERGENCY FIX] Orphaned pomo ${pomo.id.substring(0, 8)} - no matching task found`);
                    orphaned++;
                }
            }
        }

        tx.oncomplete = () => {
            console.log(`[EMERGENCY FIX] ✅ Repair complete:`);
            console.log(`  - Fixed: ${fixed} pomodoros`);
            console.log(`  - Orphaned: ${orphaned} pomodoros`);
            console.log(`  - Please reload the page to see updated stats`);

            // Trigger recalculation
            if (fixed > 0) {
                window.location.reload();
            }
        };
    };

    request.onerror = function () {
        console.error('[EMERGENCY FIX] Failed to open database:', request.error);
    };
})();
