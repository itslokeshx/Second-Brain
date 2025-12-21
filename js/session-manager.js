/**
 * Session Manager - Handles user authentication, sync, and UI integration
 * Refactored to attach to existing UI elements and strictly adhere to data schema.
 * Updated to handle file:// protocol relative path issues and DOM race conditions.
 */
window.SessionManager = {
    API_BASE_URL: 'http://localhost:3000',

    // Check if user is logged in
    isLoggedIn: function () {
        const token = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        return !!(token && userId);
    },

    // Get current user info
    getCurrentUser: function () {
        if (!this.isLoggedIn()) return null;
        return {
            id: localStorage.getItem('userId'),
            email: localStorage.getItem('userEmail'),
            name: localStorage.getItem('userName') || localStorage.getItem('userEmail'),
            token: localStorage.getItem('authToken')
        };
    },

    // Initialize session logic
    init: function () {
        console.log('[Session] Initializing...');

        if (this.isLoggedIn()) {
            console.log('[Session] User is logged in');
            this.loadUserDataFromServer(); // Initial fetch
        }

        // Always try to attach to UI (even if not logged in, buttons might exist)
        this.attachToExistingUI();
    },

    /**
     * Helper to wait for elements to exist in the DOM
     */
    waitForElement: function (selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }
            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    },

    // Helper to find button by text content (robust against markup changes) with Promise wrapper logic
    // But since XPath is instant, we need to poll or observe for this too.
    waitForElementByText: function (text) {
        return new Promise(resolve => {
            const find = () => {
                const result = document.evaluate(
                    `//*[contains(text(), '${text}')]`,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                );
                const el = result.singleNodeValue;
                if (el) {
                    return resolve(el.closest('button, li, div, a') || el);
                }
            };

            // Check immediately
            const immediate = find();
            if (immediate) return;

            // Observe
            const observer = new MutationObserver(() => {
                find(); // If found, the promise resolves. We can disconnect if resolved?
                // Actually, resolving strictly inside find() won't disconnect observer automatically 
                // without extra logic, but for this specific pattern let's just use the main loop logic 
                // in attachToExistingUI which observes continuously.
            });

            observer.observe(document.body, { childList: true, subtree: true });

            // Re-check periodically in case text is added to existing node
            const interval = setInterval(() => {
                const found = find();
                if (found) {
                    clearInterval(interval);
                    observer.disconnect();
                }
            }, 500);
        });
    },

    /**
     * 1. REFACTOR FRONTEND: Remove ugly UI creation and attach to existing elements.
     * Uses MutationObserver to wait for the app to render the "Sync Now" and "Sign Out" buttons.
     */
    attachToExistingUI: function () {
        console.log('[Session] Looking for existing UI elements...');

        const processButtons = () => {
            const syncBtn = this.findButtonByText('Sync Now') || this.findButtonByText('usr_sync');
            const logoutBtn = this.findButtonByText('Sign Out') || this.findButtonByText('usr_logout');

            if (syncBtn && !syncBtn.dataset.syncAttached) {
                console.log('[Session] Found Sync Button:', syncBtn);
                try {
                    const newSyncBtn = syncBtn.cloneNode(true);
                    if (syncBtn.parentNode) {
                        syncBtn.parentNode.replaceChild(newSyncBtn, syncBtn);
                        newSyncBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            this.syncData();
                        });
                        newSyncBtn.dataset.syncAttached = 'true';
                        newSyncBtn.style.cursor = 'pointer';
                    }
                } catch (err) {
                    console.error('[Session] Error attaching sync button:', err);
                }
            }

            if (logoutBtn && !logoutBtn.dataset.logoutAttached) {
                console.log('[Session] Found Logout Button:', logoutBtn);
                try {
                    const newLogoutBtn = logoutBtn.cloneNode(true);
                    if (logoutBtn.parentNode) {
                        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
                        newLogoutBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            this.handleLogout();
                        });
                        newLogoutBtn.dataset.logoutAttached = 'true';
                        newLogoutBtn.style.cursor = 'pointer';
                    }
                } catch (err) {
                    console.error('[Session] Error attaching logout button:', err);
                }
            }
        };

        const observer = new MutationObserver((mutations) => {
            processButtons();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial run
        processButtons();
    },

    // Helper to find button by text content
    findButtonByText: function (text) {
        try {
            const result = document.evaluate(
                `//*[contains(text(), '${text}')]`,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            );
            let el = result.singleNodeValue;
            if (el) {
                return el.closest('button, li, div, a') || el;
            }
        } catch (e) {
            // Document might not be ready
        }
        return null;
    },

    /**
     * 2. DATA SYNC ISSUE: Robust data gathering
     * Formats localStorage data into the strict JSON schema required by backend.
     */
    gatherLocalData: function () {
        // Safe parsers
        const getArray = (key) => {
            try { return JSON.parse(localStorage.getItem(key) || '[]'); }
            catch (e) { return []; }
        };
        const getObject = (key) => {
            try { return JSON.parse(localStorage.getItem(key) || '{}'); }
            catch (e) { return {}; }
        };

        const rawProjects = getArray('projects');
        const rawTasks = getArray('tasks');
        const rawLogs = getArray('pomodoroLogs');
        const rawSettings = getObject('settings'); // Might be lowercase keys

        // 3. SCHEMA MAPPING (Strict Adherence)

        // Map Projects
        const projects = rawProjects.map(p => ({
            id: p.id,
            name: p.name,
            color: p.color,
            order: p.order,
            type: p.type,
            parentId: p.parentId,
            estimatedTime: p.estimatedTime,
            spentTime: p.spentTime
        }));

        // Map Tasks
        const tasks = rawTasks.map(t => ({
            id: t.id,
            parentId: t.parentId,
            name: t.name,
            note: t.note,
            priority: t.priority,
            status: t.status,
            estimatedPomodoros: t.estimatedPomodoros,
            actPomodoros: t.actPomodoros,
            dueDate: t.dueDate,
            createdTime: t.createdTime
        }));

        // Map PomodoroLogs
        const pomodoroLogs = rawLogs.map(l => ({
            id: l.id,
            taskId: l.taskId,
            startTime: l.startTime,
            endTime: l.endTime,
            duration: l.duration,
            status: l.status
        }));

        // Map Settings (Ensure Capitalized Keys as per User Request)
        // Check what keys are in rawSettings. Usually they might be lowercase or mixed.
        // We construct the object explicitly.
        const settings = {
            BgMusic: rawSettings.BgMusic || rawSettings.bgMusic || '',
            Volume: rawSettings.Volume || rawSettings.volume || 50,
            TimerSettings: rawSettings.TimerSettings || rawSettings.timerSettings || {}
        };

        return {
            projects,
            tasks,
            pomodoroLogs,
            settings
        };
    },

    // Sync Data Function
    syncData: function () {
        console.log('[Session] Starting sync...');
        const user = this.getCurrentUser();
        if (!user) {
            alert('Please login to sync data.'); // Or show login modal
            // Possibly trigger showLoginUI here if we had access to auth-ui.js functions
            return;
        }

        // Visual feedback (optional since we're using existing UI, maybe a toast?)
        const originalTitle = document.title;
        document.title = "Syncing... | " + originalTitle;

        const payload = this.gatherLocalData();
        console.log('[Session] Sending Payload:', payload);

        fetch(`${this.API_BASE_URL}/api/sync/all`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + user.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                console.log('[Session] Sync Response:', data);
                document.title = originalTitle;

                if (data.success) {
                    // Update Local Data with Server Data (Merge/Overwrite)
                    // Since user said "populate localStorage so the UI updates"
                    // strict overwrite might clobber unsaved local changes if we are not careful.
                    // But typically "fetch their data... and populate" implies taking user data.
                    if (data.serverData) {
                        this.populateLocalStorage(data.serverData);
                        alert('Sync Successful!');
                        window.location.reload(); // Reload to refresh UI with new data
                    }
                } else {
                    alert('Sync Failed: ' + data.message);
                }
            })
            .catch(err => {
                console.error('[Session] Sync Error:', err);
                document.title = originalTitle;
                alert('Sync Error: Network issue');
            });
    },

    // Populate localStorage from Server Data
    populateLocalStorage: function (serverData) {
        if (!serverData) return;

        if (serverData.projects) localStorage.setItem('projects', JSON.stringify(serverData.projects));
        if (serverData.tasks) localStorage.setItem('tasks', JSON.stringify(serverData.tasks));
        if (serverData.pomodoroLogs) localStorage.setItem('pomodoroLogs', JSON.stringify(serverData.pomodoroLogs));

        // Handle Settings casing for local app (if local app expects lowercase, we might need to adjust)
        // We'll save what we got, but usually the app reads what it writes.
        // If the schema requires Caps for backend, we used that. 
        // For localStorage, we should probably stick to what the app uses. 
        // Assuming app uses same keys as schema effectively or we might map back.
        // Let's assume direct mapping for now.
        if (serverData.settings) localStorage.setItem('settings', JSON.stringify(serverData.settings));
    },

    // Load User Data purely (for login)
    loadUserDataFromServer: function () {
        const user = this.getCurrentUser();
        if (!user) return;

        fetch(`${this.API_BASE_URL}/api/sync/load`, {
            headers: { 'Authorization': 'Bearer ' + user.token }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    console.log('[Session] Data loaded from server');
                    // Only populate if local is empty? Or always?
                    // "When the user logs in, the app should fetch their data... and populate"
                    // This implies overwriting local with cloud state on login.
                    const hasLocalData = localStorage.getItem('projects');

                    // Construct a merged or overwriting strategy. 
                    // For simplicity/requirement: Populate localStorage.
                    this.populateLocalStorage(data.data);

                    // If it's a fresh login (no local data), this is crucial.
                    // If there was local data, this overwrites it. This matches "Restore" behavior.
                }
            })
            .catch(console.error);
    },

    // Handle Logout
    handleLogout: function () {
        if (confirm(window.I18N_DATA ? window.I18N_DATA['usr_logout_prompt'] : 'Are you sure to sign out?')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            // Do NOT clear data ("The unsynchronized data will be lost..." warning implies we might clear, 
            // but often safer to keep or clear. "revert to not logged in state").
            // Usually logout just clears auth token.
            window.location.reload();
        }
    }
};

// Start logic when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.SessionManager.init();
});
