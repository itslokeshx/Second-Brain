// ✅ DUAL-MODE SESSION MANAGER (Cookie + Token Fallback)
(function () {
    'use strict';

    const SessionManager = {
        currentUser: null,
        token: null,
        checkInterval: null,
        cookieMonitorInterval: null,

        init: function () {
            console.log('[Session] Initializing dual-mode auth...');

            // 🛠 If a previous patch forced an unrealistically high Version flag (e.g., 888), reset it
            // to let main.js run its preset-project upgrade (required for sidebar defaults).
            const storedVersion = Number(localStorage.getItem('Version') || '0');
            if (storedVersion > 10) {
                console.log('[Session] Fixing Version flag (was ' + storedVersion + ') -> 0 to allow upgrade');
                localStorage.setItem('Version', '0');
            }

            // 🛠 If we somehow marked "reloaded-after-sync" but have no project data, clear the flag so
            // a fresh load can run and repopulate storage/IndexedDB.
            if (sessionStorage.getItem('reloaded-after-sync')) {
                const projectsRaw = localStorage.getItem('pomodoro-projects') || '[]';
                if (projectsRaw === '[]') {
                    console.log('[Session] Clearing stale reloaded-after-sync flag (no local projects present)');
                    sessionStorage.removeItem('reloaded-after-sync');
                }
            }

            // ✅ CRITICAL: Set PID=0 EARLY if user is authenticated (before main.js reads cookies)
            // This prevents main.js from seeing PID=undefined and crashing
            const cookieUser = this.getUserFromCookies();
            if (cookieUser) {
                const rawCookies = document.cookie;
                if (!rawCookies.includes('PID=0') && !rawCookies.match(/PID=([^;]+)/)?.[1] === '0') {
                    document.cookie = `PID=0; path=/; max-age=31536000`;
                    console.log('[Session] ✅ Early PID=0 cookie set (before main.js)');
                }
            }

            // Try to restore from localStorage token first
            this.token = localStorage.getItem('authToken');

            // Check login status
            this.checkLoginStatus();

            // Setup UI handlers
            this.setupHandlers();
        },

        checkLoginStatus: async function () {
            try {
                // ✅ FIRST: Check cookies for existing session
                const cookieUser = this.getUserFromCookies();

                // ✅ DUAL-MODE REQUEST
                const headers = {
                    'Content-Type': 'application/json'
                };

                // Add token if we have it
                if (this.token) {
                    headers['X-Session-Token'] = this.token;
                }

                const apiUrl = window.AppConfig
                    ? window.AppConfig.getApiUrl('/v64/user/config')
                    : 'http://localhost:3000/v64/user/config';

                const response = await fetch(apiUrl, {
                    method: 'GET',
                    credentials: 'include', // ✅ Still try cookies
                    headers: headers
                });

                const data = await response.json();

                if (data.status === 0 && data.user) {
                    // ✅ SAVE TOKEN (from response or existing)
                    this.token = data.token || data.jsessionId || this.token;
                    if (this.token) {
                        localStorage.setItem('authToken', this.token);
                    }

                    this.currentUser = data.user;
                    this.updateUI(true, data.user.email || data.acct);
                    this.startPeriodicCheck();
                    console.log('[Session] ✅ Authenticated:', data.user.email);

                    // ✅ AUTO-LOAD DATA: Fetch projects/tasks from backend
                    console.log('[Session] 📥 Loading data from server...');
                    this.loadDataAfterLogin().catch(err => {
                        console.warn('[Session] Data load failed, using local data:', err);
                    });
                } else if (cookieUser) {
                    // ✅ FALLBACK: Use cookie data if API doesn't return user
                    console.log('[Session] Using cookie-based auth:', cookieUser.email);
                    this.currentUser = cookieUser;
                    this.token = cookieUser.sessionId;
                    if (this.token) {
                        localStorage.setItem('authToken', this.token);
                    }
                    this.updateUI(true, cookieUser.email);

                    // ✅ AUTO-LOAD DATA: Fetch projects/tasks from backend
                    console.log('[Session] 📥 Loading data from server (cookie auth)...');
                    this.loadDataAfterLogin().catch(err => {
                        console.warn('[Session] Data load failed, using local data:', err);
                    });
                } else {
                    this.handleLoggedOut();
                }
            } catch (error) {
                console.error('[Session] Check failed:', error);
                // ✅ FALLBACK: Try cookies even if fetch fails
                const cookieUser = this.getUserFromCookies();
                if (cookieUser) {
                    console.log('[Session] Fallback to cookies:', cookieUser.email);
                    this.currentUser = cookieUser;
                    this.token = cookieUser.sessionId;
                    this.updateUI(true, cookieUser.email);

                    // ✅ AUTO-LOAD DATA: Fetch projects/tasks from backend
                    console.log('[Session] 📥 Loading data from server (fallback)...');
                    this.loadDataAfterLogin().catch(err => {
                        console.warn('[Session] Data load failed, using local data:', err);
                    });
                } else {
                    this.handleLoggedOut();
                }
            }
        },

        // ✅ NEW: Extract user from cookies
        getUserFromCookies: function () {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                if (key) acc[key] = decodeURIComponent(value || '');
                return acc;
            }, {});

            // Check if we have user cookies AND they're not literally "undefined"
            if (cookies.ACCT && cookies.UID &&
                cookies.ACCT !== 'undefined' && cookies.UID !== 'undefined') {

                // Get session ID from various cookie sources
                const sessionId = cookies['secondbrain.sid'] ||
                    cookies.JSESSIONID ||
                    cookies['secondbrain.token'] ||
                    null;

                // ✅ Save to localStorage for fallback
                if (sessionId && sessionId !== 'undefined') {
                    localStorage.setItem('authToken', sessionId);
                }

                return {
                    email: cookies.ACCT,
                    id: cookies.UID,
                    username: cookies.NAME && cookies.NAME !== 'undefined' ? cookies.NAME : cookies.ACCT.split('@')[0],
                    sessionId: sessionId
                };
            }
            return null;
        },

        handleLoggedOut: function () {
            this.currentUser = null;
            this.token = null;
            localStorage.removeItem('authToken');
            this.stopPeriodicCheck();
            this.updateUI(false);
            console.log('[Session] Not authenticated');
        },

        updateUI: function (isLoggedIn, username = '') {
            // Try multiple selectors for username display
            const userDisplay = document.querySelector('#username-display') ||
                document.querySelector('.user-name') ||
                document.querySelector('#user-display') ||
                document.querySelector('[data-user-name]') ||
                document.querySelector('.username');

            // Set cookies for legacy app compatibility if logged in
            if (isLoggedIn && this.currentUser) {
                const userName = this.currentUser.username || username.split('@')[0];
                document.cookie = `NAME=${encodeURIComponent(userName)}; path=/; max-age=31536000`;
                document.cookie = `UID=${this.currentUser.id}; path=/; max-age=31536000`;

                // ✅ CRITICAL: ALWAYS set PID=0 (don't check, just set it - cookie-patcher will filter invalid values)
                // The legacy app crashes/renders blank if PID is missing or "undefined"
                document.cookie = `PID=0; path=/; max-age=31536000`;
                console.log('[Session] ✅ Set PID=0 cookie (critical for main.js)');
            }

            // Update specific UI elements if they exist
            const userNameElement = document.querySelector('.UserMenu-name-6i3fW'); // This line was in the instruction, but seems out of place if it's not part of the `userDisplay` chain. Keeping it as per instruction.

            const loginBtn = document.querySelector('.login-btn, #login-button');
            const logoutBtn = document.querySelector('.logout-btn, #logout-button');

            if (isLoggedIn) {
                // Update UI elements
                if (userDisplay) {
                    userDisplay.textContent = username;
                    userDisplay.setAttribute('data-user-name', username);
                    userDisplay.style.color = '#4CAF50'; // Green to indicate logged in
                }
                if (loginBtn) loginBtn.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'block';

                console.log('[Session] ✅ UI updated for:', username);

                // ✅ FIX: Override main.js username display
                this.forceUsernameDisplay(username);

            } else {
                if (userDisplay) {
                    userDisplay.textContent = 'Not logged in';
                    userDisplay.removeAttribute('data-user-name');
                    userDisplay.style.color = '#999'; // Gray for not logged in
                }
                if (loginBtn) loginBtn.style.display = 'block';
                if (logoutBtn) logoutBtn.style.display = 'none';

            }
        },

        // ✅ NEW: Force correct username display by overriding main.js
        forceUsernameDisplay: function (userEmail) {
            // Extract username from email
            const username = userEmail.split('@')[0];

            // Find the actual username element used by main.js
            const findAndUpdate = () => {
                // Look for HomeHeader-username class (CSS modules use hashed names)
                const usernameEl = document.querySelector('[class*="HomeHeader-username"]');

                if (usernameEl && usernameEl.textContent !== username) {
                    console.log('[Session] Setting header username to:', username);
                    usernameEl.textContent = username;

                    // Watch for changes and override them
                    const observer = new MutationObserver(() => {
                        if (usernameEl.textContent !== username) {
                            console.log('[Session] main.js tried to change username, reverting...');
                            usernameEl.textContent = username;
                        }
                    });

                    observer.observe(usernameEl, {
                        childList: true,
                        characterData: true,
                        subtree: true
                    });
                }

                // Also fix AccountSettings-account elements (shows in settings)
                const accountEls = document.querySelectorAll('[class*="AccountSettings-account"]');
                accountEls.forEach(el => {
                    // Only fix span/div elements, NOT buttons
                    if (el && el.tagName !== 'BUTTON' && el.textContent && el.textContent.includes('')) {
                        console.log('[Session] Fixing AccountSettings element');
                        // Account field should show EMAIL, not username
                        const cookies = document.cookie.split(';').reduce((acc, c) => {
                            const [k, v] = c.trim().split('=');
                            acc[k] = decodeURIComponent(v || '');
                            return acc;
                        }, {});
                        el.textContent = cookies.ACCT || userEmail;
                    }
                });
            };

            // Try immediately
            findAndUpdate();

            // Try after delays (main.js might set it later)
            setTimeout(findAndUpdate, 100);
            setTimeout(findAndUpdate, 500);
            setTimeout(findAndUpdate, 1000);
            setTimeout(findAndUpdate, 2000);
        },


        setupHandlers: function () {
            // Logout handler
            const logoutBtn = document.querySelector('.logout-btn, #logout-button');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.logout());
            }
        },

        logout: async function () {
            console.log('[Session] 🚪 Logout initiated');

            try {
                // Stop intervals FIRST
                this.stopPeriodicCheck();

                // Get user ID before clearing
                const userId = this.currentUser?.id || window.UserDB?.getCurrentUserId();

                // Call backend logout
                const apiUrl = window.AppConfig
                    ? window.AppConfig.getApiUrl('/v63/user/logout')
                    : 'http://localhost:3000/v63/user/logout';

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        credentials: 'include'
                    });
                    const data = await response.json();
                    console.log('[Session] Logout response:', data);
                } catch (e) {
                    console.warn('[Session] Backend logout failed (continuing anyway):', e);
                }

                // Clear local state
                this.handleLoggedOut();

                // ═══════════════════════════════════════════════════════════════════════
                // CRITICAL: Delete user-scoped IndexedDB (bypasses Guardian)
                // ═══════════════════════════════════════════════════════════════════════
                if (userId && window.UserDB) {
                    try {
                        await window.UserDB.deleteUserDB(userId);
                        console.log('[Session] ✅ User database deleted');
                    } catch (e) {
                        console.error('[Session] ❌ Failed to delete user database:', e);
                    }
                }

                // Clear ALL localStorage
                localStorage.clear();
                console.log('[Session] ✅ localStorage cleared');

                // Clear ALL sessionStorage
                sessionStorage.clear();
                console.log('[Session] ✅ sessionStorage cleared');

                // Clear ALL cookies
                document.cookie.split(';').forEach(c => {
                    const name = c.trim().split('=')[0];
                    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
                });
                console.log('[Session] ✅ All cookies cleared');

                console.log('[Session] ✅ Logout complete, reloading...');

                // Reload to fresh state
                setTimeout(() => window.location.reload(), 200);
            } catch (error) {
                console.error('[Session] Logout error:', error);
                // Force reload anyway
                setTimeout(() => window.location.reload(), 500);
            }
        },

        // ✅ HELPER: Get auth headers for other modules
        getAuthHeaders: function () {
            const headers = {};
            if (this.token) {
                headers['X-Session-Token'] = this.token;
            }
            return headers;
        },

        startPeriodicCheck: function () {
            // DISABLED: No automatic checks - sync only on manual button click
            console.log('[Session] ℹ️ Automatic sync disabled - use sync button to sync data');

            // Clear any existing intervals
            if (this.checkInterval) clearInterval(this.checkInterval);
            if (this.cookieMonitorInterval) clearInterval(this.cookieMonitorInterval);

            this.checkInterval = null;
            this.cookieMonitorInterval = null;

            // Optional: Very infrequent session validation (every 5 minutes) just to check if still logged in
            // Uncomment if you want basic session validation without data sync
            /*
            this.checkInterval = setInterval(() => {
                if (this.currentUser) {
                    this.checkLoginStatus();
                }
            }, 300000); // 5 minutes
            */
        },

        stopPeriodicCheck: function () {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
            if (this.cookieMonitorInterval) {
                clearInterval(this.cookieMonitorInterval);
                this.cookieMonitorInterval = null;
            }
        },

        loadDataAfterLogin: async function () {
            // Check reload flag - if set, we already saved data, just ensure it's in both stores
            const hasReloadedAfterSync = sessionStorage.getItem('reloaded-after-sync');

            if (!window.SyncService) {
                console.log('[Session] SyncService not available, skipping data load');
                return;
            }

            try {
                // ALWAYS load from server to ensure we have latest data
                console.log('[Session] Loading data from server...');
                const data = await window.SyncService.loadAll();

                if (!data || (!data.projects?.length && !data.tasks?.length)) {
                    console.log('[Session] No data from server');
                    return;
                }

                console.log('[Session] Loaded from server:', {
                    projects: data.projects?.length || 0,
                    tasks: data.tasks?.length || 0
                });

                // ALWAYS save to BOTH IndexedDB and localStorage
                console.log('[Session] Saving to IndexedDB...');
                await this.saveToIndexedDB(data);

                console.log('[Session] Saving to localStorage...');
                this.saveToLocalStorage(data);

                // Ensure sidebar data
                this.ensureLocalSidebarData();

                // Only reload ONCE (first time after login)
                if (!hasReloadedAfterSync && (data.projects?.length > 0 || data.tasks?.length > 0)) {
                    console.log('[Session] 🔄 First data load - reloading page to render UI...');
                    sessionStorage.setItem('reloaded-after-sync', 'true');
                    setTimeout(() => {
                        window.location.reload();
                    }, 100);
                    return;
                }

                console.log('[Session] ✅ Data load complete (no reload needed)');

            } catch (error) {
                console.error('[Session] Data load failed:', error);
            }
        },

        // ✅ NEW: Ensure data from localStorage is available in IndexedDB (for main.js)
        ensureIndexedDBDataAvailable: async function () {
            try {
                const localProjects = JSON.parse(localStorage.getItem('pomodoro-projects') || '[]');
                const localTasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');

                if (localProjects.length === 0 && localTasks.length === 0) {
                    console.log('[Session] No local data to copy to IndexedDB');
                    return;
                }

                console.log('[Session] Ensuring local data is in IndexedDB...', {
                    projects: localProjects.length,
                    tasks: localTasks.length
                });

                const data = {
                    projects: localProjects,
                    tasks: localTasks,
                    pomodoros: JSON.parse(localStorage.getItem('pomodoro-pomodoros') || '[]'),
                    subtasks: []
                };

                await this.saveToIndexedDB(data);
                console.log('[Session] ✅ IndexedDB data ensured');
            } catch (error) {
                console.error('[Session] Failed to ensure IndexedDB data:', error);
            }
        },

        // ✅ NEW: Ensure sidebar order/list keys exist and dispatch storage events to wake UI
        ensureLocalSidebarData: function () {
            try {
                const projects = JSON.parse(localStorage.getItem('pomodoro-projects') || '[]');
                if (!Array.isArray(projects) || projects.length === 0) return;

                const projectOrder = projects.map(p => p.id);
                if (!localStorage.getItem('pomodoro-projectOrder')) {
                    localStorage.setItem('pomodoro-projectOrder', JSON.stringify(projectOrder));
                    console.log(`[Session] ✅ Rebuilt pomodoro-projectOrder (${projectOrder.length} items)`);
                }

                let customList = [];
                try {
                    customList = JSON.parse(localStorage.getItem('custom-project-list') || '[]');
                    if (!Array.isArray(customList)) customList = [];
                } catch (e) {
                    customList = [];
                }
                // Ensure at least default project is present
                if (!customList.includes('0')) customList.unshift('0');
                // Ensure all known project ids are represented (keeps order simple)
                projectOrder.forEach(id => {
                    if (!customList.includes(id)) customList.push(id);
                });

                localStorage.setItem('custom-project-list', JSON.stringify(customList));
                console.log(`[Session] ✅ Ensured custom-project-list (${customList.length} items)`);

                // Dispatch storage events to trigger React/legacy listeners
                ['pomodoro-projects', 'pomodoro-projectOrder', 'custom-project-list'].forEach(key => {
                    window.dispatchEvent(new StorageEvent('storage', {
                        key,
                        newValue: localStorage.getItem(key),
                        url: window.location.href,
                        storageArea: localStorage
                    }));
                });
            } catch (e) {
                console.error('[Session] ensureLocalSidebarData failed:', e);
            }
        },

        // ✅ NEW: Save to IndexedDB (Required for main.js rendering)
        saveToIndexedDB: function (data) {
            return new Promise((resolve, reject) => {
                const dbName = window.UserDB ? window.UserDB.getDBName() : 'PomodoroDB6';
                const request = indexedDB.open(dbName);

                request.onerror = (event) => {
                    console.error('[Session] IDB Open Error:', event.target.error);
                    resolve(); // Don't block
                };

                request.onsuccess = (event) => {
                    const db = event.target.result;
                    const availableStores = Array.from(db.objectStoreNames);
                    console.log('[Session] IDB Available stores:', availableStores);

                    // Map stores
                    const projectStoreName = availableStores.find(s => s.toLowerCase().includes('project'));
                    const taskStoreName = availableStores.find(s => s === 'Task') ||
                        availableStores.find(s => s.toLowerCase().includes('task') || s.toLowerCase().includes('todo'));
                    const pomodoroStoreName = availableStores.find(s => s.toLowerCase().includes('pomodoro') || s.toLowerCase().includes('log'));
                    const subtaskStoreName = availableStores.find(s => s === 'Subtask');
                    const groupUserStoreName = availableStores.find(s => s === 'GroupUser');

                    console.log('[Session] IDB Mapped stores:', { projectStoreName, taskStoreName, pomodoroStoreName, subtaskStoreName, groupUserStoreName });

                    try {
                        const tx = db.transaction(availableStores, 'readwrite');

                        tx.oncomplete = () => {
                            console.log('[Session] ✅ IndexedDB transaction complete');
                            resolve();
                        };

                        tx.onerror = (e) => {
                            console.error('[Session] IDB Transaction Error:', e.target.error);
                            resolve();
                        };

                        // 1. Projects
                        if (projectStoreName && data.projects && data.projects.length > 0) {
                            const store = tx.objectStore(projectStoreName);
                            let count = 0;
                            data.projects.forEach(item => {
                                if (!item.id && item._id) item.id = item._id;
                                store.put(item);
                                count++;
                            });
                            console.log(`[Session] IDB: Put ${count} projects to '${projectStoreName}'`);
                        }

                        // 2. Tasks
                        if (taskStoreName && data.tasks && data.tasks.length > 0) {
                            const store = tx.objectStore(taskStoreName);
                            let count = 0;
                            data.tasks.forEach(item => {
                                if (!item.id && item._id) item.id = item._id;
                                store.put(item);
                                count++;
                            });
                            console.log(`[Session] IDB: Put ${count} tasks to '${taskStoreName}'`);
                        }

                        // 3. Subtasks
                        if (subtaskStoreName && data.subtasks && data.subtasks.length > 0) {
                            const store = tx.objectStore(subtaskStoreName);
                            let count = 0;
                            data.subtasks.forEach(item => {
                                if (!item.id && item._id) item.id = item._id;
                                store.put(item);
                                count++;
                            });
                            console.log(`[Session] IDB: Put ${count} subtasks to '${subtaskStoreName}'`);
                        }

                        // 4. GroupUser (Profile)
                        if (groupUserStoreName && this.currentUser) {
                            const store = tx.objectStore(groupUserStoreName);
                            // Ensure UUID matches the UID cookie/ID so lookups succeed
                            const uId = this.currentUser.id || this.userId || 'user-1';
                            const userProfile = {
                                id: uId,
                                uuid: uId, // ✅ CRITICAL: main.js queries by uuid index
                                name: this.currentUser.username || 'User',
                                email: this.currentUser.email,
                                sync: 1,
                                // Add other potential fields to be safe
                                validUntil: Date.now() + 31536000000,
                                pro: 1,
                                vip: 1
                            };
                            store.put(userProfile);
                            console.log(`[Session] IDB: Put user profile to '${groupUserStoreName}' (UUID: ${uId})`);
                        }

                        // 5. Pomodoros
                        if (pomodoroStoreName && data.pomodoros && data.pomodoros.length > 0) {
                            const store = tx.objectStore(pomodoroStoreName);
                            let count = 0;
                            data.pomodoros.forEach(item => {
                                if (!item.id && item._id) item.id = item._id;
                                store.put(item);
                                count++;
                            });
                            console.log(`[Session] IDB: Put ${count} pomodoros to '${pomodoroStoreName}'`);
                        }

                    } catch (error) {
                        console.error('[Session] IDB Transaction Start Failed:', error);
                        resolve();
                    }
                };
            });
        },

        // Helper to save data to localStorage
        saveToLocalStorage: function (data) {
            try {
                console.log('[Session] Saving to localStorage...');

                // 1. Capture a valid Project ID for the PID cookie
                // Try to find "Tasks" or "Inbox" project first
                let validPid = '0';
                if (data.projects && data.projects.length > 0) {
                    // Log all project IDs to help debugging
                    console.log('[Session] Available Projects:', data.projects.map(p => ({ id: p.id, name: p.name })));

                    const defaultProject = data.projects.find(p => p.name === 'Inbox' || p.name === 'Tasks' || p.name === 'My Tasks');
                    if (defaultProject) {
                        validPid = defaultProject.id;
                    } else {
                        validPid = data.projects[0].id;
                    }

                    // Store/Set PID Cookie immediately
                    if (validPid) {
                        console.log(`[Session] Setting PID cookie to valid project ID: ${validPid}`);
                        document.cookie = `PID=${validPid}; path=/; max-age=31536000`;
                    }

                    localStorage.setItem('pomodoro-projects', JSON.stringify(data.projects));
                    console.log(`[Session] ✅ Saved ${data.projects.length} projects`);

                    // ✅ CRITICAL: Create and save project order
                    // Without this, main.js might not know how to list the projects
                    const projectOrder = data.projects.map(p => p.id);
                    localStorage.setItem('pomodoro-projectOrder', JSON.stringify(projectOrder));
                    console.log(`[Session] ✅ Saved projectOrder (${projectOrder.length} items)`);

                    // ✅ CRITICAL: Sidebar Project List
                    // main.js uses 'custom-project-list' to determine what shows in the sidebar
                    localStorage.setItem('custom-project-list', JSON.stringify(projectOrder));
                    console.log(`[Session] ✅ Saved custom-project-list (${projectOrder.length} items)`);
                }

                if (data.tasks && data.tasks.length > 0) {
                    localStorage.setItem('pomodoro-tasks', JSON.stringify(data.tasks));
                    console.log(`[Session] ✅ Saved ${data.tasks.length} tasks`);
                }

                if (data.pomodoros && data.pomodoros.length > 0) {
                    localStorage.setItem('pomodoro-pomodoros', JSON.stringify(data.pomodoros));
                    console.log(`[Session] ✅ Saved ${data.pomodoros.length} pomodoros`);
                }

                // ✅ CRITICAL: Set legacy migration flags UNCONDITIONALLY
                // These prevent "upgrading" logic that might fail or hang the app
                localStorage.setItem('UpdateV64Data', 'true');
                localStorage.setItem('UpdateTasksData', 'true');
                if (!localStorage.getItem('InstallationDate')) {
                    localStorage.setItem('InstallationDate', Date.now());
                }
                localStorage.setItem('RegionCode', 'US');

                console.log('[Session] ✅ Legacy migration flags set');
                console.log('[Session] ✅ localStorage updated');

                // ✅ CRITICAL: Dispatch events for BOTH projects and order
                console.log('[Session] Dispatching storage event to trigger UI update...');
                const storageKeys = ['pomodoro-projects', 'pomodoro-projectOrder', 'custom-project-list'];
                storageKeys.forEach(key => {
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: key,
                        newValue: localStorage.getItem(key),
                        url: window.location.href,
                        storageArea: localStorage
                    }));
                });

            } catch (e) {
                console.error('[Session] localStorage save failed:', e);
            }
        }
    };

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SessionManager.init());
    } else {
        SessionManager.init();
    }

    // Intervals are now managed by startPeriodicCheck/stopPeriodicCheck methods

    // Export globally
    window.SessionManager = SessionManager;

    console.log('[Session] Manager loaded - Dual-mode auth ready');
})();
