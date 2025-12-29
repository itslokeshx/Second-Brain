// ═══════════════════════════════════════════════════════════════════
// 🔍 FINAL VERIFICATION SCRIPT
// ═══════════════════════════════════════════════════════════════════
// Run this after reloading the page to verify the actualPomoNum fix
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// 🔍 VERIFICATION LOGIC
// ═══════════════════════════════════════════════════════════════════

window.runVerification = function () {
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('🔍 CRASH DIAGNOSTIC (LocalStorage Check)');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    try {
        const projectsRaw = localStorage.getItem('pomodoro-projects');
        const tasksRaw = localStorage.getItem('pomodoro-tasks');
        const listRaw = localStorage.getItem('custom-project-list');

        if (!projectsRaw || !tasksRaw) {
            console.warn('⚠️ LocalStorage MISSING essential keys (projects/tasks).');
            // This explains "0m" but not the crash (unless main.js crashes on null)
        } else {
            const projects = JSON.parse(projectsRaw);
            const tasks = JSON.parse(tasksRaw);

            console.log(`📦 LocalStorage: ${projects.length} Projects, ${tasks.length} Tasks`);

            // 1. Check Project Structure
            if (!Array.isArray(projects)) {
                console.error('❌ CRASH RISK: projects is NOT an array!');
            } else {
                // Check if map lookup works
                const pMap = {};
                projects.forEach(p => pMap[p.id] = p);

                // 2. Check for Orphan Tasks (Common crash cause)
                let orphans = 0;
                tasks.forEach(t => {
                    if (t.projectId && !pMap[t.projectId]) {
                        orphans++;
                        console.error(`❌ ORPHAN TASK: "${t.name}" refs missing project "${t.projectId}"`);
                    }
                });

                if (orphans > 0) console.error(`Found ${orphans} orphan tasks. This causes crashes when completing tasks.`);
                else console.log('✅ No orphan tasks found.');

                // 3. Check Custom List (Sidebar crash cause)
                if (listRaw) {
                    const list = JSON.parse(listRaw);
                    if (Array.isArray(list)) {
                        let missingListItems = 0;
                        list.forEach(id => {
                            if (!pMap[id]) {
                                missingListItems++;
                                console.error(`❌ BROKEN SIDEBAR: ID "${id}" in custom-project-list NOT found in projects.`);
                            }
                        });
                        if (missingListItems > 0) console.error(`Found ${missingListItems} broken sidebar items. This crashes the UI render.`);
                        else console.log('✅ Sidebar list is coherent.');
                    }
                }
            }
        }
    } catch (e) {
        console.error('❌ Error assessing LocalStorage:', e);
    }

    const userId = document.cookie.split(';').find(c => c.trim().startsWith('UID='))?.split('=')[1];

    if (!userId) {
        console.log('ℹ️ Waiting for User ID...');
        // If run too early, don't crash
        return;
    }

    const dbName = `PomodoroDB6_${userId}`;
    console.log(`🔍 Inspecting Database: ${dbName}`);

    // Open without version to avoid triggering upgrade/creation of empty DB
    const request = indexedDB.open(dbName);

    request.onsuccess = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains('Task')) {
            console.warn('⚠️ Database exists but "Task" store is missing.');
            console.warn('   The app likely hasn\'t finished initializing the DB schema yet.');
            return;
        }

        // Get all tasks
        const taskTx = db.transaction('Task', 'readonly');
        const taskStore = taskTx.objectStore('Task');
        const taskRequest = taskStore.getAll();

        taskRequest.onsuccess = () => {
            const tasks = taskRequest.result;

            // Get all pomodoros
            const pomoTx = db.transaction('Pomodoro', 'readonly');
            const pomoStore = pomoTx.objectStore('Pomodoro');
            const pomoRequest = pomoStore.getAll();

            pomoRequest.onsuccess = () => {
                const pomodoros = pomoRequest.result;

                console.log('📊 DATABASE STATE:\n');
                console.log(`   Tasks: ${tasks.length}`);
                console.log(`   Pomodoros: ${pomodoros.length}\n`);

                // Count pomodoros per task
                const pomodorosByTask = {};
                pomodoros.forEach(p => {
                    if (p.taskId && p.status === 'completed') {
                        pomodorosByTask[p.taskId] = (pomodorosByTask[p.taskId] || 0) + 1;
                    }
                });

                console.log('═══════════════════════════════════════════════════════════════════');
                console.log('📋 TASK VERIFICATION:\n');

                let allCorrect = true;

                tasks.forEach(task => {
                    const expectedCount = pomodorosByTask[task.id] || 0;
                    const actualCount = task.actualPomoNum || 0;
                    const isCorrect = expectedCount === actualCount;

                    if (!isCorrect) allCorrect = false;

                    const status = isCorrect ? '✅' : '❌';

                    // Only log mismatches or first few to avoid spam
                    if (!isCorrect || tasks.length < 10) {
                        console.log(`${status} Task: ${task.name || task.id.substring(0, 8)}`);
                        console.log(`   Expected actualPomoNum: ${expectedCount}`);
                        console.log(`   Actual actualPomoNum: ${actualCount}`);

                        if (!isCorrect && expectedCount > 0) {
                            const elapsedMs = actualCount * (task.pomodoroInterval || 1500) * 1000;
                            const elapsedMin = Math.floor(elapsedMs / 60000);
                            console.log(`   UI should show: ${elapsedMin}m elapsed`);
                        }
                        if (!isCorrect) console.log('');
                    }
                });

                console.log('═══════════════════════════════════════════════════════════════════');
                console.log('🎯 POMODORO DETAILS (Last 5):\n');

                // Show last 5 logs only
                pomodoros.slice(-5).forEach(p => {
                    const durationMin = Math.floor((p.duration || 0) / 60000);
                    const durationSec = Math.floor(((p.duration || 0) % 60000) / 1000);
                    console.log(`   ${p.id.substring(0, 8)}: ${durationMin}m ${durationSec}s (${p.status || 'unknown'})`);
                });

                console.log('\n═══════════════════════════════════════════════════════════════════');

                if (allCorrect) {
                    console.log('✅ ALL TASKS HAVE CORRECT actualPomoNum!');
                    console.log('✅ UI should display correct elapsed times');
                } else {
                    console.log('❌ SOME TASKS HAVE INCORRECT actualPomoNum');
                    console.log('⚠️  Try triggering a sync/reload to recalculate.');
                }

                console.log('═══════════════════════════════════════════════════════════════════\n');
            };
        };
    };

    request.onerror = () => {
        console.error('❌ Failed to open IndexedDB or DB not initialized yet.');
    };
};

console.log('✅ Verification script ready - Auto-execution disabled for stability');
console.log('💡 Run manually: window.verifyPomoFix()');

window.verifyPomoFix = function () {
    window.runVerification();
};
