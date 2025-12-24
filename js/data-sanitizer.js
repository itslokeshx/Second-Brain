// Data Sanitizer - Cleans localStorage to prevent main.js crashes
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

    let fixedCount = 0;

    KEYS_TO_SANITIZE.forEach(key => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return;

            let data = JSON.parse(raw);
            if (!Array.isArray(data)) return;

            const originalLength = data.length;

            // Filter out null, undefined, or items missing 'id' (basic check)
            // The specific error was reading 'type' of undefined, so removing undefined items is key
            data = data.filter(item => {
                if (!item) return false;
                if (typeof item !== 'object') return false;
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

    if (fixedCount > 0) {
        console.log(`[Data Sanitizer] ✅ Removed ${fixedCount} corrupt items. Reload recommended if issues persist.`);
    } else {
        console.log('[Data Sanitizer] ✅ Data integrity verified.');
    }

    // ✅ FIX: REFERENTIAL INTEGRITY CHECK
    // Ensure all tasks belong to a valid project to prevent "reading type of undefined" crash
    try {
        const projectsRaw = localStorage.getItem('pomodoro-projects') || '[]';
        const tasksRaw = localStorage.getItem('pomodoro-tasks') || '[]';

        let projects = JSON.parse(projectsRaw);
        let tasks = JSON.parse(tasksRaw);

        if (Array.isArray(projects) && Array.isArray(tasks)) {
            // 1. Ensure a default project exists
            let defaultProject = projects.find(p => p.id === '0' || p.id === 0);
            if (!defaultProject) {
                console.warn('[Data Sanitizer] ⚠️ No default project found! Creating one...');
                defaultProject = {
                    id: '0', // Standard ID for "Tasks" / Inbox
                    name: 'Tasks',
                    type: 'project', // Critical field
                    color: '#FF6B6B',
                    order: 0,
                    completed: false,
                    deleted: false
                };
                projects.unshift(defaultProject);
                localStorage.setItem('pomodoro-projects', JSON.stringify(projects));
                console.log('[Data Sanitizer] ✅ Created missing default "Tasks" project.');
            }

            // 2. Reassign orphaned tasks
            const projectIds = new Set(projects.map(p => String(p.id)));
            let orphanedCount = 0;

            tasks = tasks.map(task => {
                const pid = String(task.projectId || task.parentId || '');
                // If project doesn't exist, assign to default project (ID '0')
                if (!projectIds.has(pid)) {
                    orphanedCount++;
                    task.projectId = defaultProject.id;
                    task.parentId = defaultProject.id;
                }
                return task;
            });

            if (orphanedCount > 0) {
                console.warn(`[Data Sanitizer] ⚠️ Found ${orphanedCount} orphaned tasks. Reassigned to default project.`);
                localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));
            }

            // 3. Fix Project Nesting (Orphaned Folders)
            // If a project has a parentId that doesn't exist, main.js crashes when building the tree
            let projectsChanged = false;
            projects = projects.map(p => {
                if (p.parentId && p.parentId !== '' && !projectIds.has(String(p.parentId))) {
                    console.warn(`[Data Sanitizer] ⚠️ Project "${p.name}" has missing parent ${p.parentId}. Moving to root.`);
                    p.parentId = ''; // Move to root
                    projectsChanged = true;
                }
                return p;
            });

            if (projectsChanged) {
                localStorage.setItem('pomodoro-projects', JSON.stringify(projects));
            }

            // 4. Sanitize custom-project-list (Sort Order)
            // If this list contains IDs of deleted projects, main.js crashes when rendering sidebar
            const customListRaw = localStorage.getItem('custom-project-list');
            if (customListRaw) {
                try {
                    let customList = JSON.parse(customListRaw);
                    if (Array.isArray(customList)) {
                        const originalListLength = customList.length;
                        // Only keep IDs that actually exist in 'projects'
                        customList = customList.filter(id => projectIds.has(String(id)));

                        if (customList.length !== originalListLength) {
                            console.warn(`[Data Sanitizer] ⚠️ Found ${originalListLength - customList.length} invalid IDs in custom-project-list. Removing...`);
                            localStorage.setItem('custom-project-list', JSON.stringify(customList));
                        }
                    }
                } catch (e) {
                    console.error('[Data Sanitizer] Error cleaning custom-project-list:', e);
                }
            }
        }
    } catch (e) {
        console.error('[Data Sanitizer] Error checking referential integrity:', e);
    }

})();
