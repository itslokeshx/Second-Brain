/**
 * Sync Button Handler
 * Explicitly connects the sync button to the MongoDB sync service
 * Removes any premium feature gates
 */

(function () {

    function initSyncButton() {

        // Extended selectors for legacy Second Brain sync button
        const selectors = [
            '[data-sync]',
            '.sync-button',
            '#sync-btn',
            'button[title*="sync" i]',
            'button[title*="Sync" i]',
            '.header-sync',
            '.icon-sync',
            '.sync', // Common legacy class
            '.top-bar-right-sync',
            '[class*="sync-icon"]'
        ];

        const findAndAttach = () => {
            let syncBtn = null;
            for (const selector of selectors) {
                syncBtn = document.querySelector(selector);
                if (syncBtn) {
                    break;
                }
            }

            if (syncBtn && !syncBtn.dataset.wired) {
                // Remove existing onclick handlers
                const clonedBtn = syncBtn.cloneNode(true);
                syncBtn.parentNode.replaceChild(clonedBtn, syncBtn);
                syncBtn = clonedBtn;

                // Attach new handler
                syncBtn.addEventListener('click', handleSyncClick);
                syncBtn.dataset.wired = "true"; // Mark as processed
                return true;
            }
            return false;
        };

        // Attempt immediately
        if (findAndAttach()) return;

        // Use MutationObserver for dynamic rendering
        const observer = new MutationObserver((mutations) => {
            if (findAndAttach()) {
                observer.disconnect();
            }
        });

        const root = document.getElementById('root') || document.body;
        observer.observe(root, { childList: true, subtree: true });

        // Fallback global listener (keep as failsafe)
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, div, span, a') || e.target;
            const text = (target.innerText || '').toLowerCase();
            const title = (target.getAttribute('title') || '').toLowerCase();
            const className = (target.className || '').toString().toLowerCase();

            // Check if we already handled this in the attached handler
            if (target.dataset && target.dataset.wired) return;

            if (text.includes('sync') || title.includes('sync') || className.includes('sync')) {
                handleSyncClick(e);
            }
        }, true);
    }

    /**
     * Properly check authentication by validating token with server
     */
    /**
     * Properly check authentication using centralized AuthFetch
     */
    async function checkAuthentication() {
        if (!window.AuthFetch?.isAuthenticated()) {
            return false;
        }

        try {
            const apiUrl = window.AppConfig
                ? window.AppConfig.getApiUrl('/v64/user/config')
                : 'http://localhost:3000/v64/user/config';

            const response = await window.AuthFetch.get(apiUrl);
            return response.ok;
        } catch (error) {
            console.error('[Sync Button] Auth check failed:', error);
            return false;
        }
    }

    async function handleSyncClick(e) {
        e.preventDefault();
        e.stopPropagation();


        // ═══════════════════════════════════════════════════════════════════════
        // RULE 1: Block if hydration not complete
        // ═══════════════════════════════════════════════════════════════════════
        if (window.HydrationMutex && !window.HydrationMutex.canSync()) {
            const state = window.HydrationMutex.getState();
            console.warn('[Sync Button] ⚠️ Hydration not ready:', state.state);
            if (window.showNotification) {
                window.showNotification('Please wait for data to load... (' + state.state + ')', 'warning', 3000);
            } else {
                alert('Please wait for data to load...');
            }
            return;
        }

        // ═══════════════════════════════════════════════════════════════════════
        // RULE 2: Block if sync already in progress
        // ═══════════════════════════════════════════════════════════════════════
        if (window._syncInProgress) {
            console.warn('[Sync Button] ⚠️ Sync already in progress');
            if (window.showNotification) {
                window.showNotification('Sync already in progress', 'warning', 3000);
            }
            return;
        }

        // ═══════════════════════════════════════════════════════════════════════
        // RULE 3: Validate auth with retry
        // ═══════════════════════════════════════════════════════════════════════
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
            console.warn('[Sync Button] ⚠️ Not authenticated');
            if (window.showNotification) {
                window.showNotification('Please login to sync data', 'error', 5000);
            } else {
                alert('Please login first to sync data.');
            }
            return;
        }

        // Set sync lock
        window._syncInProgress = true;

        // Try new sync service
        if (window.SyncService) {
            try {

                // Get data from user-scoped IndexedDB
                const dbName = window.UserDB ? window.UserDB.getDBName() : 'PomodoroDB6';
                const dbRequest = indexedDB.open(dbName);

                const data = await new Promise((resolve, reject) => {
                    dbRequest.onerror = () => reject(dbRequest.error);
                    dbRequest.onsuccess = () => {
                        const db = dbRequest.result;
                        const projects = [];
                        const tasks = [];
                        const pomodoroLogs = [];

                        // Check if object stores exist
                        const storeNames = Array.from(db.objectStoreNames);

                        if (storeNames.length === 0) {
                            console.warn('[Sync Button] No data stores found in IndexedDB');
                            resolve({ projects, tasks, pomodoroLogs });
                            return;
                        }

                        const transaction = db.transaction(storeNames, 'readonly');
                        let completed = 0;
                        const total = storeNames.length;

                        storeNames.forEach(storeName => {
                            const store = transaction.objectStore(storeName);
                            const getAllRequest = store.getAll();

                            getAllRequest.onsuccess = () => {
                                const items = getAllRequest.result || [];

                                // Categorize data
                                if (storeName.toLowerCase().includes('project')) {
                                    projects.push(...items);
                                } else if (storeName.toLowerCase().includes('task') || storeName.toLowerCase().includes('todo')) {
                                    tasks.push(...items);
                                } else if (storeName.toLowerCase().includes('pomodoro') || storeName.toLowerCase().includes('log')) {
                                    pomodoroLogs.push(...items);
                                }

                                completed++;
                                if (completed === total) {
                                    resolve({ projects, tasks, pomodoroLogs });
                                }
                            };

                            getAllRequest.onerror = () => {
                                completed++;
                                if (completed === total) {
                                    resolve({ projects, tasks, pomodoroLogs });
                                }
                            };
                        });
                    };
                });

                    projects: data.projects.length,
                    tasks: data.tasks.length,
                    logs: data.pomodoroLogs.length
                });

                // ✅ FALLBACK: If IndexedDB is empty, try localStorage
                if (data.projects.length === 0) {
                    try {
                        const lsProjects = JSON.parse(localStorage.getItem('pomodoro-projects') || '[]');
                        if (lsProjects.length > 0) {
                            data.projects = lsProjects;
                        }
                    } catch (e) { console.warn('[Sync Button] localStorage projects parse error:', e); }
                }

                if (data.tasks.length === 0) {
                    try {
                        const lsTasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
                        if (lsTasks.length > 0) {
                            data.tasks = lsTasks;
                        }
                    } catch (e) { console.warn('[Sync Button] localStorage tasks parse error:', e); }
                }

                if (data.pomodoroLogs.length === 0) {
                    try {
                        const lsLogs = JSON.parse(localStorage.getItem('pomodoro-pomodoros') || '[]');
                        if (lsLogs.length > 0) {
                            data.pomodoroLogs = lsLogs;
                        }
                    } catch (e) { console.warn('[Sync Button] localStorage logs parse error:', e); }
                }

                    projects: data.projects.length,
                    tasks: data.tasks.length,
                    logs: data.pomodoroLogs.length
                });

                // ✅ PROTECTION: Ensure system projects are included before sync
                if (window.IndexedDBGuardian && window.SYSTEM_PROJECTS) {
                    data.projects = window.IndexedDBGuardian.mergeWithSystemProjects(data.projects);
                }

                // ✅ CLEANUP: Remove keystroke artifacts before syncing
                if (data.tasks.length > 0) {
                    const initialCount = data.tasks.length;

                    // Filter out keystroke artifacts with STRICT Heuristics
                    data.tasks = data.tasks.filter(t => {
                        // ═══════════════════════════════════════════════════════════════════════
                        // 🔧 CRITICAL FIX: NEVER filter unsynced tasks (sync: 0)
                        // If a task has sync: 0, it MUST be synced regardless of content
                        // This prevents data loss from overly aggressive filtering
                        // ═══════════════════════════════════════════════════════════════════════
                        if (t.sync === 0) {
                            return true; // ALWAYS include unsynced tasks
                        }

                        // For already-synced tasks (sync: 1), apply artifact detection heuristics
                        // Real tasks usually have meaningful IDs or creation times, but 
                        // we focus on content structure.
                        const validName = t.name && t.name.length >= 3;
                        const hasOtherProps = (t.deadline && t.deadline !== 0) ||
                            (t.projectId && t.projectId !== '0') ||
                            (t.priority && t.priority > 0) ||
                            (t.tags && t.tags.length > 0) ||
                            (t.description && t.description.length > 0);

                        // 🔍 HEURISTIC 2: Legacy Compatibility
                        // Long text without props might be a quick "brain dump" task
                        // INCREASED THRESHOLD: Must be 20+ chars to avoid username poisoning ("itslokeshx" is 10)
                        const legitimateLongText = t.name && t.name.length >= 20;

                        // Only filter already-synced tasks that look like artifacts
                        const shouldKeep = (validName && hasOtherProps) || legitimateLongText;

                        if (!shouldKeep) {
                        }

                        return shouldKeep;
                    });

                    const removed = initialCount - data.tasks.length;
                    if (removed > 0) {

                        // Update storage with cleaned data to prevent recurrence
                        try {
                            localStorage.setItem('tasks', JSON.stringify(data.tasks));
                        } catch (e) {
                            console.warn('[Sync Button] Cleanup storage update failed:', e);
                        }
                    }
                }

                const result = await window.SyncService.syncAll({
                    projects: data.projects,
                    tasks: data.tasks,
                    pomodoroLogs: data.pomodoroLogs
                });


                // ═══════════════════════════════════════════════════════════════════════
                // 🔧 PHASE 3 FIX: Backend-Authoritative Dirty State
                // Only mark items as synced if backend ACKed them
                // ═══════════════════════════════════════════════════════════════════════
                try {

                    // Create sets of IDs that were SENT to backend
                    const sentTaskIds = new Set(data.tasks.map(t => t.id));
                    const sentProjectIds = new Set(data.projects.map(p => p.id));
                    const sentLogIds = new Set(data.pomodoroLogs.map(l => l.id));

                    // Update tasks - ONLY those we sent AND backend confirmed
                    const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
                    let tasksUpdated = 0;
                    tasks.forEach(t => {
                        if (sentTaskIds.has(t.id) && result.success) {
                            if (t.sync === 0) {
                                t.sync = 1;
                                tasksUpdated++;
                            }
                        }
                    });
                    if (tasksUpdated > 0) {
                        localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));
                    }

                    // Update projects
                    const projects = JSON.parse(localStorage.getItem('pomodoro-projects') || '[]');
                    let projectsUpdated = 0;
                    projects.forEach(p => {
                        if (sentProjectIds.has(p.id) && result.success) {
                            if (p.sync === 0) {
                                p.sync = 1;
                                projectsUpdated++;
                            }
                        }
                    });
                    if (projectsUpdated > 0) {
                        localStorage.setItem('pomodoro-projects', JSON.stringify(projects));
                    }

                    // Update logs
                    const logs = JSON.parse(localStorage.getItem('pomodoro-pomodoros') || '[]');
                    let logsUpdated = 0;
                    logs.forEach(l => {
                        if (sentLogIds.has(l.id) && result.success) {
                            if (l.sync === 0) {
                                l.sync = 1;
                                logsUpdated++;
                            }
                        }
                    });
                    if (logsUpdated > 0) {
                        localStorage.setItem('pomodoro-pomodoros', JSON.stringify(logs));
                    }

                } catch (e) {
                    console.warn('[Sync Button] ⚠️ Failed to update sync flags:', e);
                }

                // ═══════════════════════════════════════════════════════════════════════
                // 🛡️ GATE C - INVARIANT 1 ENFORCEMENT: Recalculate stats after sync
                // This ensures sync doesn't leave stale 0/NaN values in localStorage
                // ═══════════════════════════════════════════════════════════════════════
                try {

                    // Reload fresh data from localStorage
                    const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
                    const pomodoros = JSON.parse(localStorage.getItem('pomodoro-pomodoros') || '[]');

                    if (tasks.length > 0 && pomodoros.length > 0 && window.SessionManager?.recalculateTaskStats) {
                        const recalculatedTasks = window.SessionManager.recalculateTaskStats(tasks, pomodoros);
                        localStorage.setItem('pomodoro-tasks', JSON.stringify(recalculatedTasks));
                    } else if (tasks.length > 0 && pomodoros.length === 0) {
                        console.warn('[Sync Button] ⚠️ GATE C: No pomodoros to recalculate - stats may be 0');
                    }
                } catch (e) {
                    console.error('[Sync Button] ❌ GATE C: Recalculation failed:', e);
                }

                // ✅ FIX: Update Sync Timestamp in UI
                try {
                    // Try multiple selectors for the timestamp
                    const timestampSelectors = [
                        '.UserDropdownMenu-menu-KviKX', // The one seen in logs
                        '[class*="UserDropdownMenu-menu"]',
                        '.sync-time',
                        '.last-synced'
                    ];

                    for (const selector of timestampSelectors) {
                        const els = document.querySelectorAll(selector);
                        els.forEach(el => {
                            if (el.textContent.includes('Synced') || el.textContent.includes('ago')) {
                                el.textContent = 'Last synced: Just now';
                                el.style.color = '#4caf50'; // Green to indicate success
                            }
                        });
                    }

                    // Also update main.js internal timestamp if possible
                    // This is a global hack to reset the "20449 days" calculation
                    const now = new Date().getTime();
                    if (window.f && window.f.default && window.f.default.shared) {
                        window.f.default.shared.syncTimestamp = now;
                    }

                    // 🕒 TIME AUTHORITY FIX: Persist to localStorage
                    // This ensures the fix survives a page reload
                    localStorage.setItem('SyncTimestamp', now);
                    localStorage.setItem('lastSyncTime', now); // Redundant backup

                } catch (e) {
                    console.warn('[Sync Button] Failed to update UI timestamp:', e);
                }

                // ✅ POST-SYNC INTEGRITY CHECK
                if (window.IndexedDBGuardian) {
                    const integrity = await window.IndexedDBGuardian.validate();
                    if (!integrity.valid) {
                        console.warn('[Sync Button] ⚠️ Missing system projects after sync, reseeding...');
                        await window.IndexedDBGuardian.forceReseed();
                    }
                }

                alert(`✅ Synced: ${result.projectsSynced || 0} projects, ${result.tasksSynced || 0} tasks, ${result.logsSynced || 0} logs`);
            } catch (error) {
                console.error('[Sync Button] ❌ Sync failed:', error);
                // Even on error, ensure system projects exist
                if (window.IndexedDBGuardian) {
                    await window.IndexedDBGuardian.validate().then(r => {
                        if (!r.valid) window.IndexedDBGuardian.forceReseed();
                    }).catch(() => { });
                }
                alert('Sync failed: ' + error.message);
            } finally {
                // Always release sync lock
                window._syncInProgress = false;
            }
            return;
        }

        // Fallback to legacy sync (main.js handles it)
    }

    // Keyboard shortcut: Ctrl+Shift+S (or Cmd+Shift+S on Mac)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
            e.preventDefault();

            if (window.syncService && window.syncService.isAuthenticated()) {
                window.syncService.syncAll().then(() => {
                }).catch((err) => {
                    console.error('[Sync Button] ❌ Keyboard sync failed:', err);
                });
            }
        }
    });

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSyncButton);
    } else {
        initSyncButton();
    }

    // Also try after a short delay in case DOM is still building
    setTimeout(initSyncButton, 1000);
    setTimeout(initSyncButton, 3000);

})();
