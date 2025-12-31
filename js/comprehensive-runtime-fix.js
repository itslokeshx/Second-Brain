/**
 * COMPREHENSIVE RUNTIME FIX
 * 
 * Based on deep investigation, this fixes:
 * 1. UI showing 0m (pomodoroInterval unit mismatch)
 * 2. Checkboxes not working (onclick handler blocking)
 * 3. React state calculation issues
 */

(function () {
    'use strict';

    console.log('[Comprehensive Fix] Loading final runtime patches...');

    // ========================================================================
    // FIX 1: Remove blocking onclick handlers from checkboxes
    // ========================================================================

    function removeBlockingHandlers() {
        const checkboxes = document.querySelectorAll('[class*="checkbox"], [class*="complete"]');
        let fixed = 0;

        checkboxes.forEach(cb => {
            if (cb.onclick && cb.onclick.toString().includes('function rn()')) {
                console.log('[Comprehensive Fix] Removing blocking onclick from:', cb.className);
                cb.onclick = null;
                fixed++;
            }
        });

        if (fixed > 0) {
            console.log('[Comprehensive Fix] ✅ Removed', fixed, 'blocking onclick handlers');
        }
    }

    // Run immediately and on mutations
    removeBlockingHandlers();

    const observer = new MutationObserver(() => {
        removeBlockingHandlers();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // ========================================================================
    // FIX 2: Force React to recalculate time with correct units
    // ========================================================================

    function forceReactUpdate() {
        try {
            // Dispatch storage event to trigger React update
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'pomodoro-tasks',
                newValue: localStorage.getItem('pomodoro-tasks'),
                url: window.location.href,
                storageArea: localStorage
            }));

            console.log('[Comprehensive Fix] ✅ Triggered React update');
        } catch (error) {
            console.error('[Comprehensive Fix] Error triggering React update:', error);
        }
    }

    // ========================================================================
    // FIX 3: Patch React's time calculation at runtime
    // ========================================================================

    // Intercept the calculation by patching the component's render
    function patchReactCalculation() {
        const root = document.querySelector('#root');
        if (!root) return;

        const reactKey = Object.keys(root).find(k =>
            k.startsWith('__reactContainer') || k.startsWith('__reactInternalInstance')
        );

        if (!reactKey) return;

        const fiberRoot = root[reactKey];

        // Find and patch summary components
        function patchFiber(node) {
            if (!node) return;

            // If this node has memoizedProps with estimatedTime
            if (node.memoizedProps && node.memoizedProps.estimatedTime !== undefined) {
                const props = node.memoizedProps;

                // Recalculate from tasks
                if (props.tasks && Array.isArray(props.tasks)) {
                    let totalTime = 0;
                    props.tasks.forEach(task => {
                        if (task.estimatePomoNum && task.pomodoroInterval) {
                            // Convert seconds to minutes
                            const timeInMinutes = (task.estimatePomoNum * task.pomodoroInterval) / 60;
                            totalTime += timeInMinutes;
                        }
                    });

                    if (totalTime > 0 && props.estimatedTime === 0) {
                        console.log('[Comprehensive Fix] Patching estimatedTime:', 0, '->', totalTime);
                        props.estimatedTime = totalTime;
                    }
                }
            }

            // Traverse children
            let child = node.child;
            while (child) {
                patchFiber(child);
                child = child.sibling;
            }
        }

        patchFiber(fiberRoot);
    }

    // ========================================================================
    // FIX 4: Ensure checkbox clicks trigger task completion
    // ========================================================================

    function attachCheckboxHandlers() {
        const checkboxes = document.querySelectorAll('[class*="checkbox"], [class*="complete"]');

        checkboxes.forEach(cb => {
            if (cb.dataset.handlerFixed === 'true') return;

            // Find task ID from parent
            let taskId = null;
            let parent = cb.closest('[class*="TaskItem"]');

            if (parent) {
                // Try to find task ID from React Fiber
                const reactKey = Object.keys(parent).find(k =>
                    k.startsWith('__reactInternalInstance') || k.startsWith('__reactFiber')
                );

                if (reactKey) {
                    let fiber = parent[reactKey];

                    // Traverse up to find task prop
                    while (fiber) {
                        if (fiber.memoizedProps && fiber.memoizedProps.task) {
                            taskId = fiber.memoizedProps.task.id;
                            break;
                        }
                        fiber = fiber.return;
                    }
                }
            }

            if (!taskId) return;

            // Attach handler
            cb.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('[Comprehensive Fix] Checkbox clicked for task:', taskId);

                try {
                    // Get tasks from localStorage
                    const tasksStr = localStorage.getItem('pomodoro-tasks');
                    if (!tasksStr) return;

                    const tasks = JSON.parse(tasksStr);
                    const task = tasks.find(t => t.id === taskId);

                    if (!task) return;

                    // Toggle completion
                    task.isFinished = !task.isFinished;
                    task.completed = task.isFinished;
                    task.finishedDate = task.isFinished ? Date.now() : 0;
                    task.sync = 0; // Mark as needing sync

                    // Save to localStorage
                    localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));

                    // Update IndexedDB
                    if (window.UserDB) {
                        const dbName = window.UserDB.getDBName();
                        const request = indexedDB.open(dbName);

                        request.onsuccess = (event) => {
                            const db = event.target.result;
                            const tx = db.transaction('Task', 'readwrite');
                            const store = tx.objectStore('Task');
                            store.put(task);
                        };
                    }

                    // CRITICAL: Force React Fiber to update
                    const root = document.querySelector('#root');
                    if (root) {
                        const reactKey = Object.keys(root).find(k =>
                            k.startsWith('__reactContainer') || k.startsWith('__reactInternalInstance')
                        );

                        if (reactKey) {
                            const fiberRoot = root[reactKey];

                            // Find and update task list components
                            function forceUpdateTaskLists(node, depth = 0) {
                                if (!node || depth > 30) return;

                                // If this node has tasks array, update it
                                if (node.memoizedProps && node.memoizedProps.tasks && Array.isArray(node.memoizedProps.tasks)) {
                                    const taskIndex = node.memoizedProps.tasks.findIndex(t => t.id === taskId);
                                    if (taskIndex !== -1) {
                                        console.log('[Comprehensive Fix] Updating task in React Fiber:', task.name);
                                        node.memoizedProps.tasks[taskIndex] = task;

                                        // Force component to re-render by updating state version
                                        if (node.stateNode && node.stateNode.forceUpdate) {
                                            node.stateNode.forceUpdate();
                                        }
                                    }
                                }

                                // Traverse children
                                let child = node.child;
                                while (child) {
                                    forceUpdateTaskLists(child, depth + 1);
                                    child = child.sibling;
                                }
                            }

                            forceUpdateTaskLists(fiberRoot);
                        }
                    }

                    // Trigger React update via storage event
                    forceReactUpdate();

                    // CRITICAL: Trigger sync to server
                    if (window.SyncService && typeof window.SyncService.syncAll === 'function') {
                        console.log('[Comprehensive Fix] Triggering sync to server...');
                        setTimeout(() => {
                            window.SyncService.syncAll().then(() => {
                                console.log('[Comprehensive Fix] ✅ Synced to server');
                            }).catch(err => {
                                console.error('[Comprehensive Fix] Sync failed:', err);
                            });
                        }, 500); // Delay to ensure IndexedDB write completes
                    } else {
                        console.warn('[Comprehensive Fix] SyncService not available, data not synced to server');
                    }

                    // Update checkbox visually
                    if (cb.tagName === 'INPUT') {
                        cb.checked = task.isFinished;
                    }

                    console.log('[Comprehensive Fix] ✅ Task toggled:', task.name, 'completed:', task.isFinished);
                } catch (error) {
                    console.error('[Comprehensive Fix] Error toggling task:', error);
                }
            }, true); // Use capture phase

            cb.dataset.handlerFixed = 'true';
        });
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    function initialize() {
        console.log('[Comprehensive Fix] Initializing...');

        // Remove blocking handlers
        removeBlockingHandlers();

        // Attach checkbox handlers
        attachCheckboxHandlers();

        // Patch React calculation
        patchReactCalculation();

        // Force update
        forceReactUpdate();

        console.log('[Comprehensive Fix] ✅ All patches applied');
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // Re-run after delays to catch dynamically rendered elements
    setTimeout(initialize, 1000);
    setTimeout(initialize, 3000);
    setTimeout(initialize, 5000);

    console.log('[Comprehensive Fix] ✅ Comprehensive fix deployed');
})();
