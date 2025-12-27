/**
 * One-time cleanup script to remove keystroke artifacts from localStorage
 * Run this in browser console to clean up existing dirty tasks
 */

(function cleanupKeystrokeArtifacts() {
    console.log('[Cleanup] Starting keystroke artifact removal...');

    try {
        // Get current tasks from localStorage
        const tasksStr = localStorage.getItem('tasks');
        if (!tasksStr) {
            console.log('[Cleanup] No tasks found in localStorage');
            return;
        }

        const tasks = JSON.parse(tasksStr);
        const originalCount = tasks.length;

        // Filter out keystroke artifacts
        const cleanedTasks = tasks.filter(task => {
            // Keep task if it's a real task
            const isRealTask = (
                (task.name && task.name.length >= 3) ||  // Name is long enough
                task.deadline ||  // Has deadline
                task.projectId ||  // Assigned to project
                task.priority ||  // Has priority
                task.tags ||  // Has tags
                task.description ||  // Has description
                task.sync === 1  // Already synced (definitely real)
            );

            if (!isRealTask) {
                console.log(`[Cleanup] 🗑️ Removing artifact: "${task.name}"`);
            }

            return isRealTask;
        });

        // Save cleaned tasks back
        localStorage.setItem('tasks', JSON.stringify(cleanedTasks));

        const removedCount = originalCount - cleanedTasks.length;
        console.log(`[Cleanup] ✅ Complete! Removed ${removedCount} keystroke artifacts`);
        console.log(`[Cleanup] Tasks before: ${originalCount}, after: ${cleanedTasks.length}`);

        // Reload page to apply changes
        console.log('[Cleanup] Reloading page in 2 seconds...');
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('[Cleanup] ❌ Error:', error);
    }
})();
