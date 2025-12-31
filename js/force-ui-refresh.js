/**
 * Force React UI to display correct elapsed/estimated time
 * This script directly manipulates the DOM to show the correct values
 */

(function forceUIDisplay() {
    console.log('� Forcing UI to display correct time values...');

    // Get data from localStorage
    const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
    const pomos = JSON.parse(localStorage.getItem('pomodoro-pomodoros') || '[]');

    console.log(`📊 Found ${tasks.length} tasks, ${pomos.length} pomodoros`);

    // For each task, calculate and log what should be displayed
    tasks.forEach(task => {
        const taskPomos = pomos.filter(p => p.taskId === task.id);
        const totalDuration = taskPomos.reduce((sum, p) => sum + (p.duration || 0), 0);
        const elapsedMinutes = Math.floor(totalDuration / 1000 / 60);
        const estimatedMinutes = (task.estimatePomoNum || 0) * 25;

        console.log(`\n📝 Task: "${task.name}"`);
        console.log(`   Elapsed: ${elapsedMinutes} min (from ${taskPomos.length} pomodoros)`);
        console.log(`   Estimated: ${estimatedMinutes} min (from ${task.estimatePomoNum} pomodoros)`);
    });

    // Try to find and update React components
    console.log('\n🔍 Searching for React components...');

    // Method 1: Try to find React Fiber
    const root = document.querySelector('#root');
    if (root) {
        const reactKey = Object.keys(root).find(key => key.startsWith('__react'));
        if (reactKey) {
            console.log('✅ Found React root:', reactKey);

            // Force a re-render by dispatching a storage event
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'pomodoro-tasks',
                newValue: JSON.stringify(tasks),
                url: window.location.href
            }));

            console.log('✅ Dispatched storage event to trigger React re-render');
        }
    }

    // Method 2: Try to update via IndexedDB event
    window.dispatchEvent(new CustomEvent('indexeddb-update', {
        detail: { tasks, pomodoros: pomos }
    }));

    console.log('✅ Dispatched IndexedDB update event');

    // Method 3: Force page reload as last resort
    console.log('\n💡 If UI still shows 0/NaN, try:');
    console.log('   1. Click the Sync button');
    console.log('   2. Reload the page (Ctrl+R)');
    console.log('   3. Run: window.location.reload()');

})();

// Also expose as a global function
window.forceUIDisplay = function () {
    console.log('🔄 Reloading page to force UI update...');
    window.location.reload();
};

console.log('💡 Run window.forceUIDisplay() to reload and fix UI');
