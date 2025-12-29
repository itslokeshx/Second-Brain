// Data Sanitizer - Cleans AND Seeds localStorage to prevent main.js crashes
(function () {
    'use strict';

    console.log('[Data Sanitizer] Initializing...');

    const KEYS_TO_SANITIZE = [
        'pomodoro-projects',
        'pomodoro-tasks',
        'pomodoro-pomodoros',
        'pomodoro-subtasks',
        'project-member',
        'custom-project-list'
    ];

    function runSanitizer() {
        console.log('[Data Sanitizer] Running sanitization...');

        let fixedCount = 0;

        // 1. Basic Cleaning (Type Checks)
        KEYS_TO_SANITIZE.forEach(key => {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) return;

                let data = JSON.parse(raw);
                if (!Array.isArray(data)) return;

                const originalLength = data.length;

                data = data.filter(item => {
                    if (!item) return false;
                    if (typeof item !== 'object' && typeof item !== 'string' && typeof item !== 'number') return false;
                    return true;
                });

                if (data.length !== originalLength) {
                    console.warn(`[Data Sanitizer] Found ${originalLength - data.length} corrupt items in ${key}. Cleaning...`);
                    localStorage.setItem(key, JSON.stringify(data));
                    fixedCount += (originalLength - data.length);
                }
            } catch (e) {
                console.error(`[Data Sanitizer] Error cleaning ${key}:`, e);
            }
        });

        // 2. SEEDING & INTEGRITY (Robust)
        try {
            const projectsRaw = localStorage.getItem('pomodoro-projects') || '[]';
            const tasksRaw = localStorage.getItem('pomodoro-tasks') || '[]';

            let projects = JSON.parse(projectsRaw);
            let tasks = JSON.parse(tasksRaw);

            if (Array.isArray(projects) && Array.isArray(tasks)) {

                // A. Ensure Default Project ("Tasks") Exists
                // Main.js likely expects Type 0 (Project) and specific ID '0'.
                let defaultProject = projects.find(p => String(p.id) === '0');

                if (!defaultProject) {
                    console.warn('[Data Sanitizer] ⚠️ No default project found! Injecting robust default.');
                    defaultProject = {
                        id: '0',        // String '0' is standard for legacy
                        name: 'Tasks',
                        type: 0,        // NUMBER 0 often used for Project in legacy
                        color: '#FF6B6B',
                        order: 0,
                        completed: false,
                        deleted: false,
                        sync: 1         // Mark as dirty so it syncs
                    };
                    projects.unshift(defaultProject);
                    localStorage.setItem('pomodoro-projects', JSON.stringify(projects));
                    fixedCount++;
                }

                // B. Reassign Orphaned Tasks
                const projectIds = new Set(projects.map(p => String(p.id)));
                let orphanedCount = 0;

                tasks = tasks.map(task => {
                    const pid = String(task.projectId || task.parentId || '');
                    if (!projectIds.has(pid)) {
                        orphanedCount++;
                        task.projectId = '0'; // Assign to Default
                        task.parentId = '0';
                        task.sync = 1;
                    }
                    return task;
                });

                if (orphanedCount > 0) {
                    console.warn(`[Data Sanitizer] ⚠️ Reassigned ${orphanedCount} orphaned tasks.`);
                    localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));
                }

                // ✅ NEW: Ensure Duration Fields on Tasks
                let durationFixCount = 0;
                tasks = tasks.map(task => {
                    let fixed = false;

                    // Ensure estimatePomoNum is numeric (default 0)
                    if (typeof task.estimatePomoNum !== 'number' || isNaN(task.estimatePomoNum)) {
                        task.estimatePomoNum = 0;
                        fixed = true;
                    }

                    // Ensure actualPomoNum is numeric (default 0)
                    if (typeof task.actualPomoNum !== 'number' || isNaN(task.actualPomoNum)) {
                        task.actualPomoNum = 0;
                        fixed = true;
                    }

                    // Ensure alias fields are in sync
                    if (typeof task.estimatedPomodoros !== 'number' || isNaN(task.estimatedPomodoros)) {
                        task.estimatedPomodoros = task.estimatePomoNum || 0;
                        fixed = true;
                    }

                    if (typeof task.actPomodoros !== 'number' || isNaN(task.actPomodoros)) {
                        task.actPomodoros = task.actualPomoNum || 0;
                        fixed = true;
                    }

                    // Ensure pomodoroInterval exists (default 1500 = 25 minutes in seconds)
                    if (typeof task.pomodoroInterval !== 'number' || isNaN(task.pomodoroInterval) || task.pomodoroInterval <= 0) {
                        task.pomodoroInterval = 1500;
                        fixed = true;
                    }

                    if (fixed) {
                        durationFixCount++;
                        task.sync = 0; // Mark as dirty to sync the fix
                    }

                    return task;
                });

                if (durationFixCount > 0) {
                    console.warn(`[Data Sanitizer] ✅ Fixed duration fields on ${durationFixCount} tasks.`);
                    localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));
                }

                // ✅ NEW: Ensure Duration Fields on Pomodoro Logs
                const pomodorosRaw = localStorage.getItem('pomodoro-pomodoros') || '[]';
                let pomodoros = JSON.parse(pomodorosRaw);
                let pomodoroFixCount = 0;

                if (Array.isArray(pomodoros)) {
                    pomodoros = pomodoros.map(pomo => {
                        let fixed = false;

                        // Ensure duration is numeric (default 0)
                        if (typeof pomo.duration !== 'number' || isNaN(pomo.duration)) {
                            // Try to calculate from startTime and endTime if available
                            if (pomo.startTime && pomo.endTime && typeof pomo.startTime === 'number' && typeof pomo.endTime === 'number') {
                                pomo.duration = pomo.endTime - pomo.startTime;
                            } else {
                                pomo.duration = 0;
                            }
                            fixed = true;
                        }

                        // Ensure startTime is numeric (default 0)
                        if (typeof pomo.startTime !== 'number' || isNaN(pomo.startTime)) {
                            pomo.startTime = 0;
                            fixed = true;
                        }

                        // Ensure endTime is numeric (default 0)
                        if (typeof pomo.endTime !== 'number' || isNaN(pomo.endTime)) {
                            pomo.endTime = 0;
                            fixed = true;
                        }

                        if (fixed) {
                            pomodoroFixCount++;
                            pomo.sync = 0; // Mark as dirty to sync the fix
                        }

                        return pomo;
                    });

                    if (pomodoroFixCount > 0) {
                        console.warn(`[Data Sanitizer] ✅ Fixed duration fields on ${pomodoroFixCount} pomodoro logs.`);
                        localStorage.setItem('pomodoro-pomodoros', JSON.stringify(pomodoros));
                    }
                }


                // C. Fix Project Nesting (Orphaned Folders)
                let projectsChanged = false;
                projects = projects.map(p => {
                    if (p.parentId && p.parentId !== '' && !projectIds.has(String(p.parentId))) {
                        console.warn(`[Data Sanitizer] ⚠️ Orphaned folder structure for "${p.name}". Moving to root.`);
                        p.parentId = '';
                        p.sync = 1;
                        projectsChanged = true;
                    }
                    // Ensure TYPE matches what we think main.js wants
                    if (p.type === 'project') p.type = 0;
                    if (p.type === 'folder') p.type = 1;

                    return p;
                });

                if (projectsChanged) {
                    localStorage.setItem('pomodoro-projects', JSON.stringify(projects));
                }

                // D. Ensure custom-project-list integrity (Safety Check)
                // CRITICAL: Do NOT filter the list if projects are missing!
                if (projects.length >= 5) { // Only filter if we have a healthy project list (system projects = ~20)
                    let customListRaw = localStorage.getItem('custom-project-list');
                    let customList = [];
                    try {
                        customList = customListRaw ? JSON.parse(customListRaw) : [];
                    } catch (e) { customList = []; }

                    if (!Array.isArray(customList)) customList = [];

                    // Filter out garbage (only if we trust 'projects' list)
                    const originalLength = customList.length;
                    customList = customList.filter(id => projectIds.has(String(id)));

                    if (customList.length !== originalLength) {
                        console.log(`[Data Sanitizer] Removed ${originalLength - customList.length} invalid items from sidebar list.`);
                    }

                    // Ensure '0' is present if not already
                    if (!customList.includes('0')) {
                        customList.unshift('0');
                        console.log('[Data Sanitizer] Added Default Project to Sidebar List.');
                    }

                    localStorage.setItem('custom-project-list', JSON.stringify(customList));
                } else {
                    console.warn(`[Data Sanitizer] ⚠️ Project list suspicious (len=${projects.length}). Skipping sidebar filtering to prevent collapse.`);
                }
                // Save cleaned list if it changed (already done by setItem above)

                // E. Clean Pomodoro Focus Task
                const focusTaskRaw = localStorage.getItem('pomodoro-focus-task');
                if (focusTaskRaw) {
                    try {
                        let focusTask = JSON.parse(focusTaskRaw);
                        if (focusTask && focusTask.projectId) {
                            if (!projectIds.has(String(focusTask.projectId))) {
                                console.warn(`[Data Sanitizer] ⚠️ Focus task points to missing project. Clearing.`);
                                localStorage.removeItem('pomodoro-focus-task');
                            }
                        } else if (focusTask && !focusTask.id) {
                            // Empty object or malformed
                            localStorage.removeItem('pomodoro-focus-task');
                        }
                    } catch (e) {
                        localStorage.removeItem('pomodoro-focus-task');
                    }
                } else {
                    // Should we inject null? localStorage.removeItem does checking implicitly.
                }
            }

        } catch (e) {
            console.error('[Data Sanitizer] Error during seeding/checking:', e);
        }

        console.log('[Data Sanitizer] ✅ Integrity check complete.');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CRITICAL FIX: Run AFTER hydration completes
    // ═══════════════════════════════════════════════════════════════════════

    // Expose globally for manual triggering
    window.runDataSanitizer = runSanitizer;

    // Listen for hydration complete event
    document.addEventListener('hydration-complete', () => {
        console.log('[Data Sanitizer] Hydration complete detected, running sanitizer...');
        runSanitizer();
    });

    // Also listen for storage events (when data is loaded)
    window.addEventListener('storage', (e) => {
        if (e.key === 'pomodoro-tasks' || e.key === 'pomodoro-projects') {
            console.log('[Data Sanitizer] Data loaded detected, running sanitizer...');
            // Use setTimeout to ensure data is fully written
            setTimeout(runSanitizer, 100);
        }
    });

    // Fallback: Run after a delay if hydration event doesn't fire
    setTimeout(() => {
        const tasks = localStorage.getItem('pomodoro-tasks');
        if (tasks && tasks !== '[]') {
            console.log('[Data Sanitizer] Fallback: Running sanitizer after delay...');
            runSanitizer();
        }
    }, 3000);

})();

