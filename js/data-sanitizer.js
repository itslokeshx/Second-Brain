// Data Sanitizer - Cleans AND Seeds localStorage to prevent main.js crashes
(function () {
    'use strict';


    const KEYS_TO_SANITIZE = [
        'pomodoro-projects',
        'pomodoro-tasks',
        'pomodoro-pomodoros',
        'pomodoro-subtasks',
        'project-member',
        'custom-project-list'
    ];

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
                }

                // Ensure '0' is present if not already
                if (!customList.includes('0')) {
                    customList.unshift('0');
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


})();
