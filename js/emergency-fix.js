/**
 * Emergency Fix - Sync Tasks to IndexedDB
 * Run this in console: window.emergencyFixTasks()
 */
(function () {
    'use strict';

    window.emergencyFixTasks = async function () {
        console.log('🚨 EMERGENCY FIX: Syncing tasks to IndexedDB...');

        try {
            // Get tasks from localStorage
            const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
            console.log(`Found ${tasks.length} tasks in localStorage`);

            // Open IndexedDB
            const userId = document.cookie.split(';').find(c => c.trim().startsWith('UID='))?.split('=')[1];
            if (!userId) {
                console.error('❌ No user ID found');
                return;
            }

            const dbName = `PomodoroDB6_${userId}`;
            console.log(`Opening database: ${dbName}`);

            const db = await new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            // Find task store
            const storeNames = Array.from(db.objectStoreNames);
            const taskStoreName = storeNames.find(s => s.toLowerCase() === 'task');

            if (!taskStoreName) {
                console.error('❌ No Task store found');
                db.close();
                return;
            }

            console.log(`Using store: ${taskStoreName}`);

            // Write all tasks to IndexedDB
            const tx = db.transaction(taskStoreName, 'readwrite');
            const store = tx.objectStore(taskStoreName);

            let count = 0;
            for (const task of tasks) {
                // Temporarily mark as clean so write protector allows it
                const cleanTask = { ...task, sync: 1 };
                store.put(cleanTask);
                count++;
            }

            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
            });

            db.close();

            console.log(`✅ Wrote ${count} tasks to IndexedDB`);
            console.log('🔄 Now refresh the page (F5) to see the fix!');

            return { success: true, count };
        } catch (e) {
            console.error('❌ Error:', e);
            return { success: false, error: e.message };
        }
    };

    console.log('[Emergency Fix] ✅ Loaded - Run: window.emergencyFixTasks()');
})();
