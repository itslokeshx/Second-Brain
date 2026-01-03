/**
 * One-time cleanup script to remove keystroke artifacts from localStorage
 * Run this in browser console to clean up existing dirty tasks
 */

(function cleanupKeystrokeArtifacts() {

    try {
        // Get current tasks from localStorage
        const tasksStr = localStorage.getItem('tasks');
        if (!tasksStr) {
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
            }

            return isRealTask;
        });

        // Save cleaned tasks back
        localStorage.setItem('tasks', JSON.stringify(cleanedTasks));

        const removedCount = originalCount - cleanedTasks.length;

        // Reload page to apply changes
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('[Cleanup] ❌ Error:', error);
    }
})();
