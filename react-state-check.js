// ═══════════════════════════════════════════════════════════════════
// 🔍 REACT STATE DIAGNOSTIC
// ═══════════════════════════════════════════════════════════════════
// Check what data React is actually using to render the UI
// ═══════════════════════════════════════════════════════════════════

(async function () {
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('🔍 REACT STATE DIAGNOSTIC');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    const userId = document.cookie.split(';').find(c => c.trim().startsWith('UID='))?.split('=')[1];

    // 1. Check localStorage (what React might be reading)
    console.log('📦 LOCALSTORAGE DATA:');
    const tasksLS = localStorage.getItem('tasks');
    if (tasksLS) {
        const tasks = JSON.parse(tasksLS);
        const task = tasks.find(t => t.id === 'B8E600E6-53E8-4B16-84D2-86BF70C73B03');
        if (task) {
            console.log(`   Task: ${task.name}`);
            console.log(`   actualPomoNum: ${task.actualPomoNum}`);
            console.log(`   actPomodoros: ${task.actPomodoros}`);
            console.log(`   estimatePomoNum: ${task.estimatePomoNum}`);
            console.log(`   pomodoroInterval: ${task.pomodoroInterval}`);
        } else {
            console.log('   ❌ Task not found in localStorage');
        }
    } else {
        console.log('   ❌ No tasks in localStorage');
    }

    // 2. Check IndexedDB (ground truth)
    console.log('\n💾 INDEXEDDB DATA:');
    const db = await new Promise((resolve) => {
        const request = indexedDB.open(`PomodoroDB6_${userId}`);
        request.onsuccess = () => resolve(request.result);
    });

    const task = await new Promise((resolve) => {
        const tx = db.transaction('Task', 'readonly');
        const store = tx.objectStore('Task');
        const request = store.get('B8E600E6-53E8-4B16-84D2-86BF70C73B03');
        request.onsuccess = () => resolve(request.result);
    });

    console.log(`   Task: ${task.name}`);
    console.log(`   actualPomoNum: ${task.actualPomoNum}`);
    console.log(`   actPomodoros: ${task.actPomodoros}`);
    console.log(`   estimatePomoNum: ${task.estimatePomoNum}`);
    console.log(`   pomodoroInterval: ${task.pomodoroInterval}`);

    // 3. Check what the UI is displaying
    console.log('\n🖥️  UI DISPLAY:');
    const statsRegion = document.querySelector('.StatisticsRegion-root-1SZbE');
    if (statsRegion) {
        const items = statsRegion.querySelectorAll('.StatisticsRegion-item-2bd7N');
        items.forEach(item => {
            const title = item.querySelector('.StatisticsRegion-title-3PZc0')?.textContent;
            const value = item.querySelector('.StatisticsRegion-value-2-Ibc')?.textContent;
            console.log(`   ${title}: ${value}`);
        });
    } else {
        console.log('   ❌ Statistics region not found');
    }

    // 4. Compare and diagnose
    console.log('\n🔬 DIAGNOSIS:');

    const tasksLSParsed = tasksLS ? JSON.parse(tasksLS) : [];
    const taskLS = tasksLSParsed.find(t => t.id === 'B8E600E6-53E8-4B16-84D2-86BF70C73B03');

    if (!taskLS) {
        console.log('❌ PROBLEM: Task not in localStorage - React can\'t read it!');
        console.log('   Solution: Sync data or reload page');
    } else if (taskLS.actualPomoNum !== task.actualPomoNum) {
        console.log('❌ PROBLEM: localStorage has stale data!');
        console.log(`   localStorage actualPomoNum: ${taskLS.actualPomoNum}`);
        console.log(`   IndexedDB actualPomoNum: ${task.actualPomoNum}`);
        console.log('   Solution: Force sync localStorage from IndexedDB');
    } else if (taskLS.actualPomoNum === 0) {
        console.log('❌ PROBLEM: actualPomoNum is 0 in both stores!');
        console.log('   This means the backend didn\'t update it during sync');
        console.log('   Solution: Trigger a sync to update the backend');
    } else {
        console.log('✅ Data looks correct in both stores');
        console.log('   The UI should be showing the correct values');
        console.log('   If not, React might not be re-rendering');
    }

    console.log('\n═══════════════════════════════════════════════════════════════════\n');
})();
