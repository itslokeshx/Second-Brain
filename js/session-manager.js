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

                // ✅ CRITICAL: Set PID (Project ID) to '0' (Inbox) if missing or undefined
                // The legacy app crashes/renders blank if PID is invalid or "undefined"
                if (!document.cookie.includes('PID=') || document.cookie.includes('PID=undefined')) {
                    console.log('[Session] Enforcing valid PID=0 cookie (Inbox)');
                    document.cookie = `PID=0; path=/; max-age=31536000`;
                }
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

                const apiUrl = window.AppConfig
                    ? window.AppConfig.getApiUrl('/v63/user/logout')
                    : 'http://localhost:3000/v63/user/logout';

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    credentials: 'include'
                });

                const data = await response.json();
                console.log('[Session] Logout response:', data);
            } catch (e) {
                console.error('[Session] Logout error:', e);
            }

            // Clear local state
            this.handleLoggedOut();

            // Clear all cookies
            document.cookie.split(';').forEach(c => {
                const name = c.trim().split('=')[0];
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
            });

            // Clear IndexedDB
            try {
                const dbName = 'PomodoroDB6';
                const deleteRequest = indexedDB.deleteDatabase(dbName);
                deleteRequest.onsuccess = () => console.log('[Session] ✅ IndexedDB cleared');
                deleteRequest.onerror = () => console.log('[Session] ⚠️ IndexedDB clear failed');
            } catch (e) {
                console.error('[Session] IndexedDB error:', e);
            }

            // Clear localStorage auth data
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');

            console.log('[Session] ✅ Logout complete, reloading...');

            // Reload after a short delay to ensure cleanup
            setTimeout(() => window.location.reload(), 200);
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
            if (!window.SyncService) {
                console.log('[Session] SyncService not available, skipping data load');
                return;
            }

            try {
                console.log('[Session] Loading synced data...');
                const data = await window.SyncService.loadAll();

                if (!data || !data.projects) {
                    console.log('[Session] No data to restore from server');
                    return;
                }

                // ✅ FIX: Don't overwrite local data with empty server data
                const localProjects = JSON.parse(localStorage.getItem('pomodoro-projects') || '[]');
                const localTasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');

                const serverHasData = (data.projects?.length > 0 || data.tasks?.length > 0);
                const localHasData = (localProjects.length > 0 || localTasks.length > 0);

                if (!serverHasData && localHasData) {
                    console.log('[Session] ⚠️ Server has no data but local has data - preserving local data');
                    console.log('[Session] Local:', { projects: localProjects.length, tasks: localTasks.length });
                    return; // Don't overwrite local data with empty server data
                }

                // ✅ CHECK IndexedDB - The legacy app REQUIRES data in IndexedDB
                console.log('[Session] Saving to IndexedDB (Critical for UI)...');
                await this.saveToIndexedDB(data);

                // ✅ ALSO Save to localStorage (Hybrid mode)
                console.log('[Session] Saving to localStorage (Backup)...');
                this.saveToLocalStorage(data);

                // ✅ CRITICAL FIX: Reload page ONCE after first data load
                // The legacy main.js only reads data on initial load, not on storage events
                const hasReloadedAfterSync = sessionStorage.getItem('reloaded-after-sync');
                if (!hasReloadedAfterSync && (data.projects?.length > 0 || data.tasks?.length > 0)) {
                    console.log('[Session] 🔄 Data saved - reloading page to render UI...');
                    sessionStorage.setItem('reloaded-after-sync', 'true');
                    setTimeout(() => {
                        window.location.reload();
                    }, 100);
                    return; // Don't continue execution
                }

            } catch (error) {
                console.error('[Session] Data load failed:', error);
                console.log('[Session] Keeping existing local data...');
            }
        },

        // ✅ NEW: Save to IndexedDB (Required for main.js rendering)
        saveToIndexedDB: function (data) {
            return new Promise((resolve, reject) => {
                const dbName = 'PomodoroDB6';
                const request = indexedDB.open(dbName);

                request.onerror = (event) => {
                    console.error('[Session] IDB Open Error:', event.target.error);
                    resolve(); // Don't block
                };

                request.onsuccess = (event) => {
                    const db = event.target.result;

                    // ✅ Dynamically detect available stores
                    const availableStores = Array.from(db.objectStoreNames);
                    console.log('[Session] IDB Available stores:', availableStores);

                    if (availableStores.length === 0) {
                        console.warn('[Session] IDB: No object stores found, skipping');
                        resolve();
                        return;
                    }

                    // Find matching stores for projects, tasks, pomodoros
                    const projectStoreName = availableStores.find(s => s.toLowerCase().includes('project'));
                    // ✅ FIX: Prioritize 'Task' over 'Subtask' - main.js expects tasks in 'Task' store
                    const taskStoreName = availableStores.find(s => s === 'Task') ||
                        availableStores.find(s => s.toLowerCase().includes('task') || s.toLowerCase().includes('todo'));
                    const pomodoroStoreName = availableStores.find(s => s.toLowerCase().includes('pomodoro') || s.toLowerCase().includes('log'));

                    console.log('[Session] IDB Mapped stores:', { projectStoreName, taskStoreName, pomodoroStoreName });

                    // Build list of stores we'll actually use
                    const storesToUse = [projectStoreName, taskStoreName, pomodoroStoreName].filter(Boolean);

                    if (storesToUse.length === 0) {
                        console.warn('[Session] IDB: No matching stores found for sync data');
                        resolve();
                        return;
                    }

                    try {
                        const transaction = db.transaction(storesToUse, 'readwrite');

                        transaction.oncomplete = () => {
                            console.log('[Session] ✅ IndexedDB transaction complete');
                            resolve();
                        };

                        transaction.onerror = (event) => {
                            console.error('[Session] IDB Transaction Error:', event.target.error);
                            resolve();
                        };

                        // 1. Projects
                        if (projectStoreName && data.projects && data.projects.length > 0) {
                            const projectStore = transaction.objectStore(projectStoreName);
                            data.projects.forEach(p => {
                                projectStore.put(p);
                            });
                            console.log(`[Session] IDB: Put ${data.projects.length} projects to '${projectStoreName}'`);
                        }

                        // 2. Tasks
                        if (taskStoreName && data.tasks && data.tasks.length > 0) {
                            const taskStore = transaction.objectStore(taskStoreName);
                            data.tasks.forEach(t => {
                                taskStore.put(t);
                            });
                            console.log(`[Session] IDB: Put ${data.tasks.length} tasks to '${taskStoreName}'`);
                        }

                        // 3. Pomodoros
                        if (pomodoroStoreName && data.pomodoros && data.pomodoros.length > 0) {
                            const pomodoroStore = transaction.objectStore(pomodoroStoreName);
                            data.pomodoros.forEach(log => {
                                pomodoroStore.put(log);
                            });
                            console.log(`[Session] IDB: Put ${data.pomodoros.length} logs to '${pomodoroStoreName}'`);
                        }
                    } catch (e) {
                        console.error('[Session] IDB Transaction setup error:', e);
                        resolve();
                    }
                };
            });
        },

        // Helper to save data to localStorage
        saveToLocalStorage: function (data) {
            try {
                console.log('[Session] Saving to localStorage...');

                if (data.projects && data.projects.length > 0) {
                    localStorage.setItem('pomodoro-projects', JSON.stringify(data.projects));
                    console.log(`[Session] ✅ Saved ${data.projects.length} projects`);
                }

                if (data.tasks && data.tasks.length > 0) {
                    localStorage.setItem('pomodoro-tasks', JSON.stringify(data.tasks));
                    console.log(`[Session] ✅ Saved ${data.tasks.length} tasks`);
                }

                if (data.pomodoros && data.pomodoros.length > 0) {
                    localStorage.setItem('pomodoro-pomodoros', JSON.stringify(data.pomodoros));
                    console.log(`[Session] ✅ Saved ${data.pomodoros.length} pomodoros`);
                }

                console.log('[Session] ✅ localStorage updated');

                // ✅ CRITICAL: Trigger storage event so main.js re-renders
                // This tells the React app that data has changed
                console.log('[Session] Dispatching storage event to trigger UI update...');
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'pomodoro-projects',
                    newValue: localStorage.getItem('pomodoro-projects'),
                    url: window.location.href,
                    storageArea: localStorage
                }));

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
