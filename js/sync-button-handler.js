/**
 * Sync Button Handler
 * Explicitly connects the sync button to the MongoDB sync service
 * Removes any premium feature gates
 */

(function () {
    console.log('[Sync Button Handler] Loading...');

    function initSyncButton() {
        console.log('[Sync Button Handler] Initializing...');

        // Extended selectors for legacy Focus To-Do sync button
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
                    console.log(`[Sync Button Handler] Found sync button using selector: ${selector}`);
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
                console.log('[Sync Button Handler] ✅ Handler attached successfully');
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
                console.log('[Sync Button Handler] Global fallback caught sync click:', target);
                handleSyncClick(e);
            }
        }, true);
    }

    async function handleSyncClick(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('[Sync Button] 🔄 Clicked! Starting manual sync...');

        // Check if user is authenticated
        const isAuth = (window.SessionManager && window.SessionManager.currentUser) ||
            document.cookie.includes('ACCT=') ||
            localStorage.getItem('authToken');
        if (!isAuth) {
            console.warn('[Sync Button] ⚠️ Not authenticated');
            alert('Please login first to sync data.');
            return;
        }

        // Try new sync service
        if (window.SyncService) {
            try {
                console.log('[Sync Button] Using new SyncService...');

                // Get data from IndexedDB (legacy app uses IndexedDB, not localStorage)
                const dbName = 'PomodoroDB6';  // ← FIXED: Correct database name
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
                        console.log('[Sync Button] IndexedDB stores:', storeNames);

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
                                console.log(`[Sync Button] ${storeName}:`, items.length, 'items');

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

                console.log('[Sync Button] Data to sync:', {
                    projects: data.projects.length,
                    tasks: data.tasks.length,
                    logs: data.pomodoroLogs.length
                });

                const result = await window.SyncService.syncAll({
                    projects: data.projects,
                    tasks: data.tasks,
                    pomodoroLogs: data.pomodoroLogs
                });

                console.log('[Sync Button] ✅ Sync completed successfully:', result);
                alert(`✅ Synced: ${result.projectsSynced || 0} projects, ${result.tasksSynced || 0} tasks, ${result.logsSynced || 0} logs`);
                return;
            } catch (error) {
                console.error('[Sync Button] ❌ Sync failed:', error);
                alert('Sync failed: ' + error.message);
                return;
            }
        }

        // Fallback to legacy sync (main.js handles it)
        console.log('[Sync Button] Using legacy sync system...');
    }

    // Keyboard shortcut: Ctrl+Shift+S (or Cmd+Shift+S on Mac)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            console.log('[Sync Button] ⌨️ Keyboard shortcut triggered (Ctrl+Shift+S)');

            if (window.syncService && window.syncService.isAuthenticated()) {
                window.syncService.syncAll().then(() => {
                    console.log('[Sync Button] ✅ Keyboard sync completed');
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

    console.log('[Sync Button Handler] ✅ Loaded (awaiting DOM ready)');
})();
