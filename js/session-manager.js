/**
 * Enhanced Session Manager with Proper Username Display and Sync
 * Fixes: Username encoding issue, sync time calculation, manual sync
 */

window.SessionManager = {
    init: function () {
        console.log('[Session] Initializing Enhanced Manager...');
        this.setupGlobalLogoutDelegation();
        this.checkLoginStatus();
    },

    checkLoginStatus: function () {
        const token = localStorage.getItem('authToken');
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');

        if (token && userEmail) {
            console.log('[Session] User session active:', userEmail);
            this.showLoggedInUI({ email: userEmail, name: userName, token });
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

    showLoggedInUI: function (user) {
        console.log('[Session] User data:', user);

        // ✅ CRITICAL: Ensure name is clean text
        let displayName = user.name || user.email || 'User';

        // Convert to plain string and remove any encoding
        displayName = String(displayName).trim();

        // If name is empty or looks encoded, use email username
        if (!displayName || displayName.length < 2 || displayName.includes('�')) {
            displayName = user.email.split('@')[0];
        }

        console.log('[Session] Display name will be:', displayName);

        this.addUserInfoToUI({ ...user, name: displayName });
    },

    addUserInfoToUI: function (user) {
        console.log('[Session] Adding user info to UI:', user);

        // Remove existing
        const existing = document.getElementById('user-info-section');
        if (existing) existing.remove();

        // Create new
        const userInfoDiv = document.createElement('div');
        userInfoDiv.id = 'user-info-section';
        userInfoDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 16px;
            background: white;
            border: 2px solid #4CAF50;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        `;

        // ✅ Create structure
        userInfoDiv.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
                <div id="username-display" style="
                    font-size: 14px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 2px;
                "></div>
                <div id="sync-status" style="
                    font-size: 11px;
                    color: #666;
                "></div>
            </div>
            <button id="sync-button-new" style="
                background: #4CAF50;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 6px;
            ">
                <span>🔄</span>
                <span>Sync Now</span>
            </button>
            <button id="logout-button-new" style="
                background: #f44336;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
            ">
                Logout
            </button>
        `;

        document.body.appendChild(userInfoDiv);

        // ✅ Set username as textContent (prevents encoding issues)
        document.getElementById('username-display').textContent = user.name;

        // ✅ Update sync status
        this.updateSyncStatus();

        // ✅ Attach event listeners
        document.getElementById('sync-button-new').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Session] Sync button clicked');
            this.manualSync();
        });

        document.getElementById('logout-button-new').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.logout();
        });

        console.log('[Session] ✅ User info UI added');
    },

    updateSyncStatus: function () {
        const statusEl = document.getElementById('sync-status');
        if (!statusEl) return;

        const lastSyncTime = localStorage.getItem('lastSyncTime');

        if (!lastSyncTime) {
            statusEl.textContent = 'Never synced';
            statusEl.style.color = '#999';
            return;
        }

        // ✅ Calculate time difference correctly
        const lastSync = new Date(lastSyncTime);
        const now = new Date();
        const diffMs = now - lastSync;
        const diffMins = Math.floor(diffMs / 60000);

        let statusText;
        let color;

        if (diffMins < 1) {
            statusText = 'Just synced';
            color = '#4CAF50';
        } else if (diffMins < 60) {
            statusText = `Synced ${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
            color = '#4CAF50';
        } else if (diffMins < 1440) { // Less than 24 hours
            const hours = Math.floor(diffMins / 60);
            statusText = `Synced ${hours} hour${hours > 1 ? 's' : ''} ago`;
            color = '#FF9800';
        } else {
            const days = Math.floor(diffMins / 1440);
            statusText = `Synced ${days} day${days > 1 ? 's' : ''} ago`;
            color = '#f44336';
        }

        statusEl.textContent = statusText;
        statusEl.style.color = color;
    },

    manualSync: function () {
        console.log('[Session] === MANUAL SYNC STARTED ===');

        const user = this.getCurrentUser();
        if (!user || !user.token) {
            alert('❌ Not logged in');
            return;
        }

        const syncButton = document.getElementById('sync-button-new');
        const statusEl = document.getElementById('sync-status');

        if (!syncButton) {
            alert('❌ Sync button not found');
            return;
        }

        // Update UI
        const originalHTML = syncButton.innerHTML;
        syncButton.innerHTML = '<span>⏳</span><span>Syncing...</span>';
        syncButton.disabled = true;
        if (statusEl) {
            statusEl.textContent = 'Syncing...';
            statusEl.style.color = '#FF9800';
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

                    // Update UI
                    this.updateSyncStatus();

                    // Show success
                    alert(`✅ Sync Successful!\n\nProjects: ${data.projectsSynced}\nTasks: ${data.tasksSynced}\nLogs: ${data.logsSynced}`);
                } else {
                    throw new Error(data.message || 'Sync failed');
                }
            })
            .catch(error => {
                console.error('[Session] ❌ Sync error:', error);
                if (statusEl) {
                    statusEl.textContent = 'Sync failed';
                    statusEl.style.color = '#f44336';
                }
                alert('❌ Sync failed: ' + error.message);
            })
            .finally(() => {
                syncButton.innerHTML = originalHTML;
                syncButton.disabled = false;
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
