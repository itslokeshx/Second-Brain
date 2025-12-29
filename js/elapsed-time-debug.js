/**
 * Pomodoro Elapsed Time Diagnostic
 * Run: window.checkElapsedTime()
 */
(function () {
    'use strict';

    window.checkElapsedTime = async function () {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🕐 ELAPSED TIME DIAGNOSTIC');
        console.log('═══════════════════════════════════════════════════════════\n');

        try {
            // 1. Check localStorage pomodoros
            const pomodorosLS = JSON.parse(localStorage.getItem('pomodoro-pomodoros') || '[]');
            console.log(`📦 localStorage: ${pomodorosLS.length} pomodoro logs\n`);

            if (pomodorosLS.length > 0) {
                console.log('Sample pomodoro log from localStorage:');
                console.table(pomodorosLS.slice(0, 3).map(p => ({
                    id: p.id?.substring(0, 8),
                    taskId: p.taskId?.substring(0, 8),
                    duration: p.duration,
                    startTime: p.startTime,
                    endTime: p.endTime,
                    durationMinutes: p.duration ? (p.duration / 60).toFixed(2) : 'N/A'
                })));

                // Calculate total elapsed time
                const totalDuration = pomodorosLS.reduce((sum, p) => {
                    const dur = Number(p.duration) || 0;
                    return sum + dur;
                }, 0);

                const totalMinutes = totalDuration / 60;
                const hours = Math.floor(totalMinutes / 60);
                const minutes = Math.floor(totalMinutes % 60);

                console.log(`\n📊 Total Elapsed Time (localStorage):`);
                console.log(`   Duration: ${totalDuration} seconds`);
                console.log(`   Formatted: ${hours}h ${minutes}m`);
            }

            // 2. Check IndexedDB pomodoros
            const userId = document.cookie.split(';').find(c => c.trim().startsWith('UID='))?.split('=')[1];
            if (!userId) {
                console.error('❌ No user ID found');
                return;
            }

            const dbName = `PomodoroDB6_${userId}`;
            const db = await new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            const storeNames = Array.from(db.objectStoreNames);
            const pomoStoreName = storeNames.find(s => s.toLowerCase().includes('pomodoro') || s.toLowerCase().includes('log'));

            if (pomoStoreName) {
                const pomodoros = await new Promise((resolve, reject) => {
                    const tx = db.transaction(pomoStoreName, 'readonly');
                    const store = tx.objectStore(pomoStoreName);
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                console.log(`\n💾 IndexedDB: ${pomodoros.length} pomodoro logs\n`);

                if (pomodoros.length > 0) {
                    console.log('Sample pomodoro log from IndexedDB:');
                    console.table(pomodoros.slice(0, 3).map(p => ({
                        id: p.id?.substring(0, 8),
                        taskId: p.taskId?.substring(0, 8),
                        duration: p.duration,
                        startTime: p.startTime,
                        endTime: p.endTime,
                        durationMinutes: p.duration ? (p.duration / 60).toFixed(2) : 'N/A'
                    })));

                    // Calculate total elapsed time
                    const totalDuration = pomodoros.reduce((sum, p) => {
                        const dur = Number(p.duration) || 0;
                        return sum + dur;
                    }, 0);

                    const totalMinutes = totalDuration / 60;
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = Math.floor(totalMinutes % 60);

                    console.log(`\n📊 Total Elapsed Time (IndexedDB):`);
                    console.log(`   Duration: ${totalDuration} seconds`);
                    console.log(`   Formatted: ${hours}h ${minutes}m`);

                    // Check if durations are valid numbers
                    const invalidCount = pomodoros.filter(p => {
                        return typeof p.duration !== 'number' || isNaN(p.duration);
                    }).length;

                    if (invalidCount > 0) {
                        console.error(`\n❌ Found ${invalidCount} pomodoros with invalid duration!`);
                    } else {
                        console.log(`\n✅ All ${pomodoros.length} pomodoros have valid durations`);
                    }
                }
            }

            db.close();

            // 3. Check current project filter
            const currentProjectId = document.cookie.split(';').find(c => c.trim().startsWith('PID='))?.split('=')[1];
            console.log(`\n📂 Current Project ID: ${currentProjectId}`);

            if (currentProjectId && pomodorosLS.length > 0) {
                const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
                const projectTasks = tasks.filter(t => String(t.projectId) === String(currentProjectId));
                const projectTaskIds = new Set(projectTasks.map(t => t.id));

                const projectPomodoros = pomodorosLS.filter(p => projectTaskIds.has(p.taskId));

                console.log(`   Tasks in project: ${projectTasks.length}`);
                console.log(`   Pomodoros for project tasks: ${projectPomodoros.length}`);

                if (projectPomodoros.length > 0) {
                    const totalDuration = projectPomodoros.reduce((sum, p) => sum + (Number(p.duration) || 0), 0);
                    const totalMinutes = totalDuration / 60;
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = Math.floor(totalMinutes % 60);

                    console.log(`   Project Elapsed Time: ${hours}h ${minutes}m`);
                } else {
                    console.log(`   ⚠️ No pomodoros found for current project tasks`);
                }
            }

        } catch (e) {
            console.error('❌ Error:', e);
        }
    };

    console.log('[Elapsed Time Diagnostic] ✅ Loaded');
    console.log('Run: window.checkElapsedTime()');
})();
