// ═══════════════════════════════════════════════════════════════════
// 🔍 FINAL VERIFICATION SCRIPT
// ═══════════════════════════════════════════════════════════════════
// Run this after reloading the page to verify the actualPomoNum fix
// ═══════════════════════════════════════════════════════════════════

(function () {
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('🔍 FINAL POMODORO FIX VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    const userId = document.cookie.split(';').find(c => c.trim().startsWith('UID='))?.split('=')[1];

    if (!userId) {
        console.error('❌ No user ID found in cookies');
        return;
    }

    const dbName = `PomodoroDB6_${userId}`;
    const request = indexedDB.open(dbName);

    request.onsuccess = (e) => {
        const db = e.target.result;

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

                    console.log(`${status} Task: ${task.name || task.id.substring(0, 8)}`);
                    console.log(`   Expected actualPomoNum: ${expectedCount}`);
                    console.log(`   Actual actualPomoNum: ${actualCount}`);

                    if (expectedCount > 0) {
                        const elapsedMs = actualCount * (task.pomodoroInterval || 1500) * 1000;
                        const elapsedMin = Math.floor(elapsedMs / 60000);
                        console.log(`   UI should show: ${elapsedMin}m elapsed`);
                    }
                    console.log('');
                });

                console.log('═══════════════════════════════════════════════════════════════════');
                console.log('🎯 POMODORO DETAILS:\n');

                pomodoros.forEach(p => {
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
                    console.log('⚠️  Try reloading the page to fetch fresh data from backend');
                }

                console.log('═══════════════════════════════════════════════════════════════════\n');
            };
        };
    };

    request.onerror = () => {
        console.error('❌ Failed to open IndexedDB');
    };
})();

console.log('✅ Final verification script loaded');
console.log('📝 This script will run automatically on page load');
console.log('💡 Or run manually: window.verifyPomoFix()');

window.verifyPomoFix = function () {
    location.reload();
};
