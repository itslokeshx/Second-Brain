/**
 * CHECKBOX FIX
 * 
 * Manually attach event handlers to checkboxes since React's synthetic events are broken
 * Uses MutationObserver to watch for new checkboxes and attach handlers
 */

(function () {
    'use strict';

    console.log('[Checkbox Fix] Loading manual event handler attachment...');

    // Function to toggle task completion
    async function toggleTaskCompletion(taskId) {
        console.log('[Checkbox Fix] Toggling task:', taskId);

        try {
            // Get task from localStorage
            const tasksStr = localStorage.getItem('pomodoro-tasks');
            if (!tasksStr) {
                console.error('[Checkbox Fix] No tasks in localStorage');
                return;
            }

            const tasks = JSON.parse(tasksStr);
            const task = tasks.find(t => t.id === taskId);

            if (!task) {
                console.error('[Checkbox Fix] Task not found:', taskId);
                return;
            }

            // Toggle completion state
            task.isFinished = !task.isFinished;
            task.completed = task.isFinished;
            task.finishedDate = task.isFinished ? Date.now() : 0;
            task.sync = 0; // Mark as dirty for sync

            console.log('[Checkbox Fix] Task toggled:', {
                id: taskId,
                name: task.name,
                isFinished: task.isFinished
            });

            // Save back to localStorage
            localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));

            // Also update IndexedDB if available
            if (window.UserDB) {
                const dbName = window.UserDB.getDBName();
                const request = indexedDB.open(dbName);

                request.onsuccess = (event) => {
                    const db = event.target.result;
                    const tx = db.transaction('Task', 'readwrite');
                    const store = tx.objectStore('Task');
                    store.put(task);
                    console.log('[Checkbox Fix] ✅ Task updated in IndexedDB');
                };
            }

            // Dispatch storage event to trigger React update
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'pomodoro-tasks',
                newValue: localStorage.getItem('pomodoro-tasks'),
                url: window.location.href,
                storageArea: localStorage
            }));

            // Force UI refresh by updating the checkbox visually
            const checkbox = document.querySelector(`input[data-task-id="${taskId}"]`);
            if (checkbox) {
                checkbox.checked = task.isFinished;
            }

            console.log('[Checkbox Fix] ✅ Task completion toggled successfully');
        } catch (error) {
            console.error('[Checkbox Fix] Error toggling task:', error);
        }
    }

    // Function to attach handler to a single checkbox
    function attachCheckboxHandler(checkbox) {
        // Skip if already attached
        if (checkbox.dataset.handlerAttached === 'true') {
            return;
        }

        // Find task ID from parent elements
        let taskId = checkbox.dataset.taskId;
        if (!taskId) {
            // Try to find from parent
            let parent = checkbox.closest('[data-task-id]');
            if (!parent) {
                // Try to find from nearby elements
                const taskRow = checkbox.closest('tr, li, div[class*="task"]');
                if (taskRow) {
                    taskId = taskRow.dataset.taskId || taskRow.id;
                }
            } else {
                taskId = parent.dataset.taskId;
            }
        }

        if (!taskId) {
            console.warn('[Checkbox Fix] Could not find task ID for checkbox');
            return;
        }

        // Store task ID on checkbox for easy access
        checkbox.dataset.taskId = taskId;

        // Attach click handler
        checkbox.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await toggleTaskCompletion(taskId);
        }, true); // Use capture phase

        // Mark as attached
        checkbox.dataset.handlerAttached = 'true';
        console.log('[Checkbox Fix] ✅ Handler attached to checkbox for task:', taskId);
    }

    // Function to scan and attach handlers to all checkboxes
    function attachAllCheckboxHandlers() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        console.log('[Checkbox Fix] Found', checkboxes.length, 'checkboxes');

        checkboxes.forEach(checkbox => {
            attachCheckboxHandler(checkbox);
        });
    }

    // Set up MutationObserver to watch for new checkboxes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if the node itself is a checkbox
                    if (node.tagName === 'INPUT' && node.type === 'checkbox') {
                        attachCheckboxHandler(node);
                    }

                    // Check for checkboxes in child nodes
                    if (node.querySelectorAll) {
                        const checkboxes = node.querySelectorAll('input[type="checkbox"]');
                        checkboxes.forEach(attachCheckboxHandler);
                    }
                }
            });
        });
    });

    // Start observing
    const targetNode = document.getElementById('root') || document.body;
    observer.observe(targetNode, {
        childList: true,
        subtree: true
    });

    // Attach handlers to existing checkboxes
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachAllCheckboxHandlers);
    } else {
        attachAllCheckboxHandlers();
    }

    // Also try after a delay to catch dynamically rendered checkboxes
    setTimeout(attachAllCheckboxHandlers, 1000);
    setTimeout(attachAllCheckboxHandlers, 3000);

    console.log('[Checkbox Fix] ✅ MutationObserver active');
    console.log('[Checkbox Fix] ✅ Checkbox fix fully deployed');
})();
