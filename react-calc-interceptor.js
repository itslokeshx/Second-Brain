// ═══════════════════════════════════════════════════════════════════
// 🔍 REACT CALCULATION INTERCEPTOR
// ═══════════════════════════════════════════════════════════════════
// Intercept what React is actually calculating for elapsed time
// ═══════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('🔍 INTERCEPTING REACT CALCULATIONS');
console.log('═══════════════════════════════════════════════════════════════════\n');

// Check what's in localStorage that React reads
const tasksLS = localStorage.getItem('tasks');
const pomodoroTasksLS = localStorage.getItem('pomodoro-tasks');

console.log('📦 LOCALSTORAGE KEYS:');
console.log(`   'tasks' exists: ${!!tasksLS}`);
console.log(`   'pomodoro-tasks' exists: ${!!pomodoroTasksLS}`);

if (tasksLS) {
    const tasks = JSON.parse(tasksLS);
    console.log(`\n📋 TASKS FROM 'tasks' KEY (${tasks.length} tasks):`);
    tasks.forEach(t => {
        console.log(`   ${t.name}:`);
        console.log(`      actualPomoNum: ${t.actualPomoNum}`);
        console.log(`      actPomodoros: ${t.actPomodoros}`);
        console.log(`      pomodoroInterval: ${t.pomodoroInterval}`);
        console.log(`      estimatePomoNum: ${t.estimatePomoNum}`);

        // Calculate what SHOULD be displayed
        const elapsedSeconds = (t.actualPomoNum || 0) * (t.pomodoroInterval || 1500);
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        const elapsedHours = Math.floor(elapsedMinutes / 60);
        const remainingMinutes = elapsedMinutes % 60;

        console.log(`      CALCULATED Elapsed: ${elapsedHours}h ${remainingMinutes}m (${elapsedSeconds}s total)`);

        const estimatedSeconds = (t.estimatePomoNum || 0) * (t.pomodoroInterval || 1500);
        const estimatedMinutes = Math.floor(estimatedSeconds / 60);
        const estimatedHours = Math.floor(estimatedMinutes / 60);
        const remainingEstMinutes = estimatedMinutes % 60;

        console.log(`      CALCULATED Estimated: ${estimatedHours}h ${remainingEstMinutes}m (${estimatedSeconds}s total)`);
    });
}

// Check what the UI is actually showing
console.log('\n🖥️  ACTUAL UI DISPLAY:');
const statsItems = document.querySelectorAll('.StatisticsRegion-item-2bd7N');
statsItems.forEach(item => {
    const title = item.querySelector('.StatisticsRegion-title-3PZc0')?.textContent;
    const value = item.querySelector('.StatisticsRegion-value-2-Ibc')?.textContent;
    console.log(`   ${title}: ${value}`);
});

console.log('\n💡 DIAGNOSIS:');
if (tasksLS) {
    const tasks = JSON.parse(tasksLS);
    const task = tasks[0];
    if (task && task.actualPomoNum > 0) {
        console.log('✅ localStorage has correct actualPomoNum');
        console.log('❌ BUT UI shows 0m - React is NOT using actualPomoNum for calculation!');
        console.log('\n🔬 POSSIBLE CAUSES:');
        console.log('   1. React is reading from a different localStorage key');
        console.log('   2. React is using a different field (not actualPomoNum)');
        console.log('   3. React is calculating from pomodoro logs directly');
        console.log('   4. The calculation happens BEFORE localStorage is populated');
    }
}

console.log('\n═══════════════════════════════════════════════════════════════════\n');
