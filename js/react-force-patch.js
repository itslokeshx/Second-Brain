/**
 * REACT STATE FORCE PATCH
 * 
 * Aggressively patches React's internal state to force correct time display
 * This directly modifies React Fiber props to inject calculated time values
 */

(function () {
    'use strict';

    console.log('[React Force Patch] Loading aggressive state patcher...');

    function calculateCorrectTime() {
        try {
            const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
            const settings = JSON.parse(localStorage.getItem('pomodoro-settings') || '{}');
            const pomodoroInterval = settings.pomodoroInterval || 1500;

            // Calculate total estimated time
            let totalEstimatedMinutes = 0;
            let totalActualMinutes = 0;
            let completedTasks = 0;
            let uncompletedTasks = 0;

            tasks.forEach(task => {
                const interval = task.pomodoroInterval || pomodoroInterval;
                const estimatePomoNum = task.estimatePomoNum || 0;
                const actualPomoNum = task.actualPomoNum || 0;

                // Estimated time in minutes
                const estimatedTime = (estimatePomoNum * interval) / 60;
                // Actual time in minutes
                const actualTime = (actualPomoNum * interval) / 60;

                totalEstimatedMinutes += estimatedTime;
                totalActualMinutes += actualTime;

                if (task.isFinished || task.completed) {
                    completedTasks++;
                } else {
                    uncompletedTasks++;
                }
            });

            return {
                estimatedTime: Math.floor(totalEstimatedMinutes),
                elapsedTime: Math.floor(totalActualMinutes),
                tasksToBeCompleted: uncompletedTasks,
                completedTasks: completedTasks
            };
        } catch (error) {
            console.error('[React Force Patch] Error calculating time:', error);
            return {
                estimatedTime: 0,
                elapsedTime: 0,
                tasksToBeCompleted: 0,
                completedTasks: 0
            };
        }
    }

    function patchReactFiber() {
        try {
            const root = document.querySelector('#root');
            if (!root) {
                console.warn('[React Force Patch] Root element not found');
                return false;
            }

            const reactKey = Object.keys(root).find(k =>
                k.startsWith('__reactContainer') || k.startsWith('__reactInternalInstance')
            );

            if (!reactKey) {
                console.warn('[React Force Patch] React key not found');
                return false;
            }

            const fiberRoot = root[reactKey];
            const stats = calculateCorrectTime();

            console.log('[React Force Patch] Calculated stats:', stats);

            // Find and patch all nodes with statistics
            function patchNode(node, depth = 0) {
                if (!node || depth > 50) return 0; // Prevent infinite recursion

                let patchedCount = 0;

                // Check if this node has props we need to patch
                if (node.memoizedProps) {
                    const props = node.memoizedProps;

                    // Patch estimated time
                    if ('estimatedTime' in props && props.estimatedTime !== stats.estimatedTime) {
                        console.log('[React Force Patch] Patching estimatedTime:', props.estimatedTime, '->', stats.estimatedTime);
                        props.estimatedTime = stats.estimatedTime;
                        patchedCount++;
                    }

                    // Patch elapsed time
                    if ('elapsedTime' in props && props.elapsedTime !== stats.elapsedTime) {
                        console.log('[React Force Patch] Patching elapsedTime:', props.elapsedTime, '->', stats.elapsedTime);
                        props.elapsedTime = stats.elapsedTime;
                        patchedCount++;
                    }

                    // Patch task counts
                    if ('tasksToBeCompleted' in props && props.tasksToBeCompleted !== stats.tasksToBeCompleted) {
                        console.log('[React Force Patch] Patching tasksToBeCompleted:', props.tasksToBeCompleted, '->', stats.tasksToBeCompleted);
                        props.tasksToBeCompleted = stats.tasksToBeCompleted;
                        patchedCount++;
                    }

                    if ('completedTasks' in props && props.completedTasks !== stats.completedTasks) {
                        console.log('[React Force Patch] Patching completedTasks:', props.completedTasks, '->', stats.completedTasks);
                        props.completedTasks = stats.completedTasks;
                        patchedCount++;
                    }
                }

                // Traverse children
                let child = node.child;
                while (child) {
                    patchedCount += patchNode(child, depth + 1);
                    child = child.sibling;
                }

                return patchedCount;
            }

            const patchedCount = patchNode(fiberRoot);
            console.log('[React Force Patch] Patched', patchedCount, 'nodes');

            // Force React to re-render by triggering a state update
            if (patchedCount > 0) {
                // Dispatch a custom event that React might be listening to
                window.dispatchEvent(new Event('forceUpdate'));

                // Also try to force a re-render by modifying the DOM slightly
                const timeElements = document.querySelectorAll('[class*="estimatedTime"], [class*="elapsedTime"]');
                timeElements.forEach(el => {
                    // Force a repaint
                    el.style.display = 'none';
                    el.offsetHeight; // Trigger reflow
                    el.style.display = '';
                });
            }

            return patchedCount > 0;
        } catch (error) {
            console.error('[React Force Patch] Error patching fiber:', error);
            return false;
        }
    }

    function forceUIUpdate() {
        const stats = calculateCorrectTime();

        // Directly update DOM elements as a fallback
        const timeElements = document.querySelectorAll('[class*="estimatedTime"]');
        timeElements.forEach(el => {
            const textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
            if (textNode && textNode.textContent.includes('m')) {
                const newText = stats.estimatedTime + 'm';
                if (textNode.textContent !== newText) {
                    console.log('[React Force Patch] Updating DOM directly:', textNode.textContent, '->', newText);
                    textNode.textContent = newText;
                }
            }
        });

        const elapsedElements = document.querySelectorAll('[class*="elapsedTime"]');
        elapsedElements.forEach(el => {
            const textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
            if (textNode && textNode.textContent.includes('m')) {
                const newText = stats.elapsedTime + 'm';
                if (textNode.textContent !== newText) {
                    console.log('[React Force Patch] Updating DOM directly:', textNode.textContent, '->', newText);
                    textNode.textContent = newText;
                }
            }
        });
    }

    function initialize() {
        console.log('[React Force Patch] Initializing...');

        // Try to patch React Fiber
        const patched = patchReactFiber();

        // If patching failed or didn't find anything, update DOM directly
        if (!patched) {
            console.log('[React Force Patch] Fiber patching failed, updating DOM directly');
            forceUIUpdate();
        }

        console.log('[React Force Patch] ✅ Initialization complete');
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // Re-run periodically to catch updates
    setInterval(() => {
        patchReactFiber();
        forceUIUpdate();
    }, 2000);

    // Re-run after delays
    setTimeout(initialize, 1000);
    setTimeout(initialize, 3000);
    setTimeout(initialize, 5000);

    console.log('[React Force Patch] ✅ Aggressive state patcher deployed');
})();
