/**
 * Session Manager - Simplified to use existing UI
 * Wires up existing sync and logout buttons instead of creating new ones
 */

window.SessionManager = {
    init: function () {
        console.log('[Session] Initializing Session Manager...');
        this.setupGlobalLogoutDelegation();
        this.checkLoginStatus();
        // Note: Sync button is handled by sync-button-handler.js
    },

    checkLoginStatus: function () {
        const token = localStorage.getItem('authToken');
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');

        if (token && userEmail) {
            console.log('[Session] User session active:', userEmail, '(' + userName + ')');
            // Just log, don't create UI - the app has its own username display
        } else {
            console.log('[Session] No active session');
        }
    },

    getCurrentUser: function () {
        return {
            email: localStorage.getItem('userEmail'),
            name: localStorage.getItem('userName'),
            token: localStorage.getItem('authToken')
        };
    },

    wireExistingSyncButton: function () {
        console.log('[Session] Looking for existing sync button to wire up...');

        // Wait a bit for the UI to render
        setTimeout(() => {
            // Try to find the existing sync button in the app's UI
            const syncSelectors = [
                'button[title*="sync" i]',
                'button[title*="Sync" i]',
                '.sync-button',
                '#sync-btn',
                '[data-sync]',
                '.header-sync'
            ];

            let syncBtn = null;
            for (const selector of syncSelectors) {
                syncBtn = document.querySelector(selector);
                if (syncBtn) {
                    console.log('[Session] Found existing sync button:', selector);
                    break;
                }
            }

            if (syncBtn) {
                // Clone to remove existing handlers
                const newBtn = syncBtn.cloneNode(true);
                syncBtn.parentNode.replaceChild(newBtn, syncBtn);

                // Add our sync handler
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.manualSync();
                });

                console.log('[Session] ✅ Wired existing sync button');
            } else {
                console.warn('[Session] Could not find existing sync button');
            }
        }, 2000);
    },

    manualSync: function () {
        console.log('[Session] === MANUAL SYNC STARTED ===');

        const user = this.getCurrentUser();
        if (!user || !user.token) {
            alert('❌ Not logged in');
            return;
        }

        // Get data from localStorage
        const projects = JSON.parse(localStorage.getItem('customProjects') || '[]');
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const pomodoroLogs = JSON.parse(localStorage.getItem('pomodoroLogs') || '[]');
        const settings = {
            BgMusic: localStorage.getItem('BgMusic'),
            Volume: localStorage.getItem('Volume'),
            TimerSettings: JSON.parse(localStorage.getItem('TimerSettings') || '{}')
        };

        console.log('[Session] Data to sync:', {
            projects: projects.length,
            tasks: tasks.length,
            logs: pomodoroLogs.length
        });

        // Send to server
        fetch('http://localhost:3000/api/sync/all', {
            method: 'POST',
            credentials: 'include', // ✅ Force cookies
            headers: {
                'Authorization': 'Bearer ' + user.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                projects,
                tasks,
                pomodoroLogs,
                settings
            })
        })
            .then(response => {
                console.log('[Session] Response status:', response.status);
                if (!response.ok) throw new Error('Server error: ' + response.status);
                return response.json();
            })
            .then(data => {
                console.log('[Session] ✅ Sync response:', data);

                if (data.success) {
                    // Save sync time
                    localStorage.setItem('lastSyncTime', new Date().toISOString());

                    // Show success
                    alert(`✅ Sync Successful!\n\nProjects: ${data.projectsSynced}\nTasks: ${data.tasksSynced}\nLogs: ${data.logsSynced}`);
                } else {
                    throw new Error(data.message || 'Sync failed');
                }
            })
            .catch(error => {
                console.error('[Session] ❌ Sync error:', error);
                alert('❌ Sync failed: ' + error.message);
            });
    },

    setupGlobalLogoutDelegation: function () {
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('a, button, div, span') || e.target;
            const text = (target.innerText || "").trim().toUpperCase();
            const className = (target.className || "").toString();
            const title = (target.getAttribute('title') || "").toUpperCase();

            const isLogout =
                text.includes("LOGOUT") ||
                text.includes("SIGN OUT") ||
                title.includes("LOGOUT") ||
                className.includes('setting-logout') ||
                className.includes('logout-btn');

            if (isLogout) {
                console.log('[Session] Logout Triggered via Delegation');
                e.preventDefault();
                e.stopPropagation();

                if (confirm('Are you sure you want to log out?')) {
                    this.logout();
                }
            }
        }, true);
    },

    logout: function () {
        console.log('[Session] Performing Logout...');

        // Clear Storage
        localStorage.clear();
        sessionStorage.clear();

        // Clear Cookies
        document.cookie.split(";").forEach(function (c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // Reload
        window.location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.SessionManager.init();
});
