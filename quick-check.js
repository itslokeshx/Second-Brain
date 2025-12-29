// ═══════════════════════════════════════════════════════════════════
// 🔍 QUICK MANUAL CHECK
// ═══════════════════════════════════════════════════════════════════
// Copy and paste this entire block into the console to check the fix
// ═══════════════════════════════════════════════════════════════════

(async function () {
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('🔍 QUICK POMODORO CHECK');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    const userId = document.cookie.split(';').find(c => c.trim().startsWith('UID='))?.split('=')[1];

    if (!userId) {
        console.error('❌ No user ID found in cookies');
        return;
    }

    console.log(`✅ User ID: ${userId}\n`);

    const dbName = `PomodoroDB6_${userId}`;
    const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    console.log(`✅ Opened database: ${dbName}\n`);

    // Get the task
    const task = await new Promise((resolve) => {
        const tx = db.transaction('Task', 'readonly');
        const store = tx.objectStore('Task');
        const request = store.get('B8E600E6-53E8-4B16-84D2-86BF70C73B03');
        request.onsuccess = () => resolve(request.result);
    });

    // Get all pomodoros for this task
    const pomodoros = await new Promise((resolve) => {
        const tx = db.transaction('Pomodoro', 'readonly');
        const store = tx.objectStore('Pomodoro');
        const request = store.getAll();
        request.onsuccess = () => {
            const all = request.result;
            const taskPomos = all.filter(p => p.taskId === 'B8E600E6-53E8-4B16-84D2-86BF70C73B03');
            resolve(taskPomos);
        };
    });

    console.log('📋 TASK DATA:');
    console.log(`   Name: ${task.name}`);
    console.log(`   actualPomoNum: ${task.actualPomoNum}`);
    console.log(`   actPomodoros: ${task.actPomodoros}`);
    console.log(`   pomodoroInterval: ${task.pomodoroInterval} seconds\n`);

    console.log('🍅 POMODOROS IN DATABASE:');
    console.log(`   Total count: ${pomodoros.length}`);
    pomodoros.forEach((p, i) => {
        const durationMin = Math.floor((p.duration || 0) / 60000);
        const durationSec = Math.floor(((p.duration || 0) % 60000) / 1000);
        console.log(`   ${i + 1}. ${p.id.substring(0, 8)}: ${durationMin}m ${durationSec}s (status: ${p.status})`);
    });

    console.log('\n💡 CALCULATION:');
    const elapsedSeconds = task.actualPomoNum * task.pomodoroInterval;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    console.log(`   Elapsed = actualPomoNum × pomodoroInterval`);
    console.log(`   Elapsed = ${task.actualPomoNum} × ${task.pomodoroInterval}`);
    console.log(`   Elapsed = ${elapsedSeconds} seconds = ${elapsedMinutes} minutes\n`);

    if (task.actualPomoNum === pomodoros.length) {
        console.log('✅ CORRECT! actualPomoNum matches pomodoro count');
        console.log(`✅ UI should show: ${elapsedMinutes}m elapsed time`);
    } else {
        console.log(`❌ MISMATCH!`);
        console.log(`   Expected actualPomoNum: ${pomodoros.length}`);
        console.log(`   Actual actualPomoNum: ${task.actualPomoNum}`);
        console.log(`   ⚠️  Backend might still be deploying - wait 30 seconds and reload`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════════\n');
})();
