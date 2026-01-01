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

            // ═══════════════════════════════════════════════════════════════════════
            // CRITICAL FIX: Detect recent logout and force clear cookies
            // ═══════════════════════════════════════════════════════════════════════
            const urlParams = new URLSearchParams(window.location.search);
            const logoutTimestamp = urlParams.get('t');

            if (logoutTimestamp) {
                const timeSinceLogout = Date.now() - parseInt(logoutTimestamp);
                // If logged out within last 5 seconds
                if (timeSinceLogout < 5000) {
                    console.log('[Session] 🚪 Recent logout detected (', timeSinceLogout, 'ms ago)');

                    // Force clear ALL cookies
                    const allCookies = document.cookie.split(';');
                    allCookies.forEach(cookie => {
                        const name = cookie.trim().split('=')[0];
                        if (name) {
                            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
                        }
                    });

                    console.log('[Session] ✅ Forced cookie clear after logout');

                    // Skip the rest of init - go straight to logged out state
                    this.handleLoggedOut();
                    return;
                }
            }


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
            // ✅ CRITICAL: If mutex is already READY, data is already loaded - skip this entirely
            if (window.HydrationMutex && window.HydrationMutex.isReady()) {
                console.log('[Session] ⏭️ Mutex already READY - data already loaded, skipping checkLoginStatus');
                return;
            }

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

                    // ✅ CRITICAL: Store userId in localStorage for hydration gate
                    if (data.user.id) {
                        localStorage.setItem('userId', data.user.id);
                        console.log('[Session] ✅ Stored userId:', data.user.id);
                    }

                    // ✅ CRITICAL: Initialize Guardian after login
                    // Guardian skips initialization if no user is logged in yet
                    // So we must trigger it manually after successful login
                    if (window.IndexedDBGuardian && !window.IndexedDBGuardian.isInitialized) {
                        console.log('[Session] 🛡️ Initializing Guardian after login...');
                        window.IndexedDBGuardian.initialize().then(() => {
                            console.log('[Session] ✅ Guardian initialized');

                            // ✅ CRITICAL P0 FIX: Start HydrationMutex after Guardian
                            // hydration-gate only runs on page load, not after UI login
                            // So Mutex stays in 'UNINITIALIZED' state, blocking sync
                            // We must manually trigger Mutex.acquire() here
                            if (window.HydrationMutex && window.HydrationMutex.getState().state === 'UNINITIALIZED') {
                                console.log('[Session] 🔒 Starting HydrationMutex after login...');
                                window.HydrationMutex.acquire(data.user.id).then(result => {
                                    if (result.success && result.state === 'READY') {
                                        console.log('[Session] ✅ Mutex ready - sync enabled');
                                    } else {
                                        console.error('[Session] ❌ Mutex failed:', result);
                                    }
                                }).catch(err => {
                                    console.error('[Session] ❌ Mutex error:', err);
                                });
                            }
                        }).catch(err => {
                            console.error('[Session] ❌ Guardian initialization failed:', err);
                        });
                    }

                    this.updateUI(true, data.user.email || data.acct);
                    this.startPeriodicCheck();
                    console.log('[Session] ✅ Authenticated:', data.user.email);

                    // ✅ IMMEDIATE RELOAD: Reload right after login to ensure UI renders properly
                    const hasReloadedAfterLogin = sessionStorage.getItem('reloaded-after-login');
                    if (!hasReloadedAfterLogin) {
                        console.log('[Session] 🔄 First login - reloading immediately for UI render...');
                        sessionStorage.setItem('reloaded-after-login', 'true');

                        // ✅ Set loader phase before reload
                        if (window.__SB_LOADER) {
                            window.__SB_LOADER.setPhase('authReload', true);
                        }

                        // Reload immediately without waiting for data
                        window.location.reload();
                        return; // Stop execution here
                    }

                    // ✅ AUTO-LOAD DATA: Only if mutex hasn't already handled it
                    if (window.HydrationMutex && window.HydrationMutex.isHandling()) {
                        console.log('[Session] ⏭️ Skipping data load - mutex is handling it');
                    } else {
                        console.log('[Session] 📥 Loading data from server...');
                        this.loadDataAfterLogin().catch(err => {
                            console.warn('[Session] Data load failed, using local data:', err);
                        });
                    }
                } else if (cookieUser) {
                    // ✅ FALLBACK: Use cookie data if API doesn't return user
                    console.log('[Session] Using cookie-based auth:', cookieUser.email);
                    this.currentUser = cookieUser;
                    this.token = cookieUser.sessionId;
                    if (this.token) {
                        localStorage.setItem('authToken', this.token);
                    }
                    this.updateUI(true, cookieUser.email);

                    // ✅ AUTO-LOAD DATA: Only if mutex hasn't already handled it
                    if (window.HydrationMutex && window.HydrationMutex.isHandling()) {
                        console.log('[Session] ⏭️ Skipping data load - mutex is handling it (cookie path)');
                    } else {
                        console.log('[Session] 📥 Loading data from server (cookie auth)...');
                        this.loadDataAfterLogin().catch(err => {
                            console.warn('[Session] Data load failed, using local data:', err);
                        });
                    }
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

                    // ✅ AUTO-LOAD DATA: Only if mutex hasn't already handled it
                    if (window.HydrationMutex && window.HydrationMutex.isHandling()) {
                        console.log('[Session] ⏭️ Skipping data load - mutex is handling it (fallback path)');
                    } else {
                        console.log('[Session] 📥 Loading data from server (fallback)...');
                        this.loadDataAfterLogin().catch(err => {
                            console.warn('[Session] Data load failed, using local data:', err);
                        });
                    }
                } else {
                    this.handleLoggedOut();
                }
            }
        },

        // ✅ NEW: Extract user from cookies
        getUserFromCookies: function () {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                if (key) {
                    // ✅ CRITICAL: Wrap decodeURIComponent in try-catch
                    // Malformed cookies (e.g., %XX with invalid hex) throw URIError
                    // which crashes the entire script and causes blank screen
                    try {
                        acc[key] = decodeURIComponent(value || '');
                    } catch (e) {
                        console.warn(`[Session] Failed to decode cookie '${key}', using raw value:`, e.message);
                        acc[key] = value || ''; // Fallback to raw value
                    }
                }
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
        setupHandlers: function () {
            // ✅ Direct click handler for Sign Out button
            document.body.addEventListener('click', (e) => {
                const text = e.target.textContent?.trim();
                const isSignOut = text === 'Sign Out' || text === 'Logout';
                const isInDropdown = e.target.closest('[class*="UserDropdownMenu"], [class*="UserMenu"]');

                if (isSignOut && isInDropdown) {
                    console.log('[Session] Sign Out clicked - triggering logout');
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    this.logout();
                }
            }, true);

            console.log('[Session] ✅ Logout handler installed');
        },


        logout: async function () {
            console.log('[Session] 🚪 Logout initiated');

            // ✅ Set loader phase for logout
            if (window.__SB_LOADER) {
                window.__SB_LOADER.setPhase('logout', true);
            }

            // ═══════════════════════════════════════════════════════════════════════
            // 🔐 STATE AUTHORITY FIX: Safe Logout Guard with Poison Detection
            // ═══════════════════════════════════════════════════════════════════════

            // 1. Check for active sync
            if (window._syncInProgress) {
                // ✅ REMOVED: Browser confirm() - React shows the dialog
                console.log('[Session] ⚠️ Sync in progress, but proceeding with logout');
            }

            // 2. HARD RESET: Purge all poisoned tasks BEFORE checking dirty state
            // This ensures accurate dirty count without contamination
            this.purgeAllPoisonedTasks();

            // 3. Check for dirty (unsynced) tasks
            // We only check localStorage as it's the fast replication layer
            // We use the new STRICT HELPER to ignore keystroke artifacts
            const dirtyCount = this.checkDirtyState();

            if (dirtyCount > 0) {
                // ✅ REMOVED: Browser confirm() - React shows the dialog
                console.log(`[Session] ⚠️ ${dirtyCount} unsynced items, but proceeding with logout`);
            }

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

                // ═══════════════════════════════════════════════════════════════════════
                // CRITICAL FIX: Clear ALL cookies SYNCHRONOUSLY before redirect
                // This prevents the browser from sending stale cookies on next request
                // ═══════════════════════════════════════════════════════════════════════
                const allCookies = document.cookie.split(';');
                const hostname = window.location.hostname;
                const rootDomain = hostname.split('.').slice(-2).join('.');

                // Clear each cookie with ALL possible domain/path combinations
                allCookies.forEach(cookie => {
                    const name = cookie.trim().split('=')[0];
                    if (name) {
                        // Clear with current domain
                        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}`;
                        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${hostname}`;

                        // Clear with root domain
                        if (rootDomain !== hostname) {
                            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${rootDomain}`;
                            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${rootDomain}`;
                        }
                    }
                });

                console.log('[Session] ✅ All cookies cleared (aggressive)');

                // Verify cookies are actually cleared
                const remainingCookies = document.cookie;
                if (remainingCookies) {
                    console.warn('[Session] ⚠️ Some cookies remain:', remainingCookies);
                } else {
                    console.log('[Session] ✅ Cookie verification: ALL cleared');
                }

                // Reset hydration mutex
                if (window.HydrationMutex) {
                    window.HydrationMutex.reset();
                    console.log('[Session] ✅ Hydration mutex reset');
                }

                console.log('[Session] ✅ Logout complete, waiting for cookies to clear...');

                // CRITICAL: Wait for browser to process cookie deletion
                // Without this delay, cookies may still exist when page reloads
                await new Promise(resolve => setTimeout(resolve, 500));

                console.log('[Session] ✅ Cookie clear delay complete, redirecting...');

                // Redirect to root with timestamp
                window.location.replace(window.location.origin + "/?t=" + Date.now());
            } catch (error) {
                console.error('[Session] Logout error:', error);
                // Force reload anyway with cache bust
                window.location.replace(window.location.origin + "/?logout=1&t=" + Date.now());
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

        // ═══════════════════════════════════════════════════════════════════════
        // 🔧 UNIFIED USERNAME HELPER (Fix for blocked NAME cookie)
        // Used by: checkDirtyState, saveToLocalStorage, hydration-mutex, purgeAllPoisonedTasks
        // ═══════════════════════════════════════════════════════════════════════
        getStoredUsername: function () {
            return this.currentUser?.username ||
                localStorage.getItem('userName') ||
                localStorage.getItem('userEmail') ||
                '';
        },

        getUsernamePrefix: function () {
            const username = this.getStoredUsername();
            return username.split('@')[0].toLowerCase();
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

        // ═══════════════════════════════════════════════════════════════════════
        // 🔐 HELPER HELPERS
        // ═══════════════════════════════════════════════════════════════════════

        purgeAllPoisonedTasks: function () {
            try {
                // Get username from helper function (bypasses blocked cookie)
                const usernamePrefix = this.getUsernamePrefix();

                if (!usernamePrefix) {
                    console.log('[Session] No username found - skipping poison purge');
                    return;
                }

                // Purge from localStorage
                const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
                const originalCount = tasks.length;
                const cleanTasks = tasks.filter(t => {
                    const taskNameLower = (t.name || '').toLowerCase();
                    const isPoisoned = taskNameLower.startsWith(usernamePrefix);
                    if (isPoisoned) {
                        console.log(`[Session] 💀 PURGE: Removing poisoned task "${t.name}" from localStorage`);
                    }
                    return !isPoisoned;
                });

                if (cleanTasks.length < originalCount) {
                    localStorage.setItem('pomodoro-tasks', JSON.stringify(cleanTasks));
                    console.log(`[Session] ✅ Purged ${originalCount - cleanTasks.length} poisoned tasks from localStorage`);
                }

                // Purge from IndexedDB
                if (window.UserDB) {
                    const userId = this.currentUser?.id || window.UserDB.getCurrentUserId();
                    if (userId) {
                        window.UserDB.openUserDB(userId).then(db => {
                            const tx = db.transaction('Task', 'readwrite');
                            const store = tx.objectStore('Task');
                            const cursorReq = store.openCursor();

                            let purgedCount = 0;
                            cursorReq.onsuccess = (event) => {
                                const cursor = event.target.result;
                                if (cursor) {
                                    const task = cursor.value;
                                    const taskNameLower = (task.name || '').toLowerCase();
                                    if (taskNameLower.startsWith(usernamePrefix)) {
                                        console.log(`[Session] 💀 PURGE: Removing poisoned task "${task.name}" from IndexedDB`);
                                        cursor.delete();
                                        purgedCount++;
                                    }
                                    cursor.continue();
                                } else if (purgedCount > 0) {
                                    console.log(`[Session] ✅ Purged ${purgedCount} poisoned tasks from IndexedDB`);
                                }
                            };
                        }).catch(err => {
                            console.warn('[Session] Failed to purge from IndexedDB:', err);
                        });
                    }
                }
            } catch (e) {
                console.warn('[Session] Poison purge failed:', e);
            }
        },

        checkActiveSync: function () {
            return window._syncInProgress === true;
        },

        checkDirtyState: function () {
            try {
                // Check localStorage for any items with sync: 0
                const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
                const logs = JSON.parse(localStorage.getItem('pomodoro-pomodoros') || '[]');
                const projects = JSON.parse(localStorage.getItem('pomodoro-projects') || '[]');

                let dirtyCount = 0;

                // ═══════════════════════════════════════════════════════════════════════
                // 🛡️ USERNAME POISON DETECTION (Logout Gate)
                // ═══════════════════════════════════════════════════════════════════════
                // FIX: Get username from stored state instead of cookies
                // (NAME cookie is blocked by cookie-patcher.js to prevent injection)
                const storedUsername = this.currentUser?.username ||
                    localStorage.getItem('userName') ||
                    '';
                const usernamePrefix = storedUsername.split('@')[0].toLowerCase();
                console.log(`[Session] 🔍 Poison detection using username: "${usernamePrefix}"`);

                // Count unsynced tasks (sync: 0), excluding poisoned ones
                // Artifact filtering is handled by sync handler, not here
                dirtyCount += tasks.filter(t => {
                    if (t.sync !== 0) return false;

                    // POISON CHECK: Ignore username-contaminated tasks
                    const taskNameLower = (t.name || '').toLowerCase();
                    if (usernamePrefix && taskNameLower.startsWith(usernamePrefix)) {
                        console.log(`[Session] 🚫 Logout: Ignoring poisoned task "${t.name}"`);
                        return false;
                    }

                    // Count all other unsynced tasks
                    console.log(`[Session] ⚠️ Unsynced task: "${t.name}"`);
                    return true;
                }).length;

                dirtyCount += logs.filter(l => l.sync === 0).length;
                dirtyCount += projects.filter(p => p.sync === 0).length;

                console.log(`[Session] 🔍 Dirty state check: ${dirtyCount} legitimate unsynced items`);
                return dirtyCount;
            } catch (e) {
                console.warn('[Session] Failed to check dirty state:', e);
                return 0;
            }
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
            // ✅ GATEKEEPER 1: Prevent concurrent data loading with Hydration Mutex
            if (window.HydrationMutex && window.HydrationMutex.isHandling()) {
                console.log('[Session] 🛑 Blocking loadDataAfterLogin - mutex is handling hydration');
                return;
            }

            // ✅ GATEKEEPER 2: Debounce protection - prevent rapid-fire loads
            const now = Date.now();
            if (this._lastDataLoad && (now - this._lastDataLoad) < 2000) {
                console.log('[Session] 🛑 Blocking loadDataAfterLogin - debounce (2s cooldown)');
                return;
            }
            this._lastDataLoad = now;

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

                // ✅ CRITICAL FIX: Recalculate task stats from pomodoro logs before saving
                if (data.tasks && data.pomodoros) {
                    console.log('[Session] 🔧 Recalculating task stats before saving to localStorage...');
                    data.tasks = this.recalculateTaskStats(data.tasks, data.pomodoros);
                }

                console.log('[Session] Saving to localStorage...');
                this.saveToLocalStorage(data);

                // Ensure sidebar data
                this.ensureLocalSidebarData();

                // ✅ RELOAD AFTER DATA LOAD: Only reload ONCE (first time after sync)
                const hasReloadedAfterSync = sessionStorage.getItem('reloaded-after-sync');
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
        // Uses two-phase approach: read dirty tasks FIRST, then write while preserving them
        saveToIndexedDB: function (data) {
            return new Promise(async (resolve, reject) => {
                const dbName = window.UserDB ? window.UserDB.getDBName() : 'PomodoroDB6';

                // ═══════════════════════════════════════════════════════════════
                // Write data with real-time dirty check (no pre-read needed)
                // ═══════════════════════════════════════════════════════════════
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

                        // 1. Projects - CRITICAL: Preserve local dirty changes (sync: 0)
                        // ✅ Same cursor-based protection as Tasks
                        // Prevents: deleted projects from being restored, settings from reverting
                        if (projectStoreName && data.projects && data.projects.length > 0) {
                            const projectStore = tx.objectStore(projectStoreName);

                            // Build map of server projects
                            const serverProjectMap = new Map();
                            data.projects.forEach(item => {
                                if (!item.id && item._id) item.id = item._id;

                                // Protect system project types
                                if (window.isSystemProject && window.isSystemProject(item.id)) {
                                    const sysProj = window.getSystemProject(item.id);
                                    if (sysProj) {
                                        item.type = sysProj.type;
                                        item.deadline = sysProj.deadline || sysProj.type;
                                        item.isSystem = true;
                                    }
                                }

                                // Ensure required fields
                                if (item.state === undefined || item.state === null) item.state = 0;
                                if (item.order === undefined || item.order === null) item.order = 0;
                                if (item.sync === undefined || item.sync === null) item.sync = 1;

                                serverProjectMap.set(item.id, item);
                            });

                            let count = 0;
                            let skipped = 0;
                            const processedIds = new Set();

                            // Cursor-based atomic merge
                            const cursorReq = projectStore.openCursor();

                            cursorReq.onsuccess = (event) => {
                                const cursor = event.target.result;

                                if (cursor) {
                                    const existingProject = cursor.value;
                                    const serverProject = serverProjectMap.get(existingProject.id);

                                    if (serverProject) {
                                        processedIds.add(existingProject.id);

                                        // CRITICAL: Preserve dirty projects (deleted/modified locally)
                                        if (existingProject.sync === 0) {
                                            console.log(`[Session] ⏭️ Preserving dirty project "${existingProject.name}" (sync:0)`);
                                            skipped++;
                                        } else {
                                            // Clean project - safe to update from server
                                            cursor.update(serverProject);
                                            count++;
                                        }
                                    } else {
                                        // Project exists locally but not on server
                                        // If clean (sync=1) and not system, it was deleted on server
                                        if (existingProject.sync === 1 && !window.isSystemProject(existingProject.id)) {
                                            console.log(`[Session] 🗑️ Deleting project "${existingProject.name}" - removed on server`);
                                            cursor.delete();
                                        }
                                    }

                                    cursor.continue();
                                } else {
                                    // Cursor finished - add new projects from server
                                    serverProjectMap.forEach((serverProject, projectId) => {
                                        if (!processedIds.has(projectId)) {
                                            projectStore.add(serverProject);
                                            count++;
                                        }
                                    });

                                    console.log(`[Session] IDB: Updated ${count} projects, preserved ${skipped} dirty projects`);
                                }
                            };

                            cursorReq.onerror = () => {
                                console.error('[Session] Project cursor error:', cursorReq.error);
                            };
                        }

                        // 2. Tasks - CRITICAL: Preserve local dirty changes (sync: 0)
                        // ✅ BULLETPROOF FIX: Use cursor-based iteration for atomic dirty check
                        // This ensures NO race condition - all reads/writes happen in same transaction
                        if (taskStoreName && data.tasks && data.tasks.length > 0) {
                            const taskStore = tx.objectStore(taskStoreName);

                            // Build map of server tasks for quick lookup
                            const serverTaskMap = new Map(data.tasks.map(t => {
                                if (!t.id && t._id) t.id = t._id;
                                return [t.id, t];
                            }));

                            let count = 0;
                            let skipped = 0;
                            const processedIds = new Set();

                            // Step 1: Iterate through ALL existing tasks using cursor
                            const cursorReq = taskStore.openCursor();

                            cursorReq.onsuccess = (event) => {
                                const cursor = event.target.result;

                                if (cursor) {
                                    const existingTask = cursor.value;
                                    const serverTask = serverTaskMap.get(existingTask.id);

                                    if (serverTask) {
                                        processedIds.add(existingTask.id);

                                        // CRITICAL: Check sync flag ATOMICALLY
                                        if (existingTask.sync === 0) {
                                            // ═══════════════════════════════════════════════════════════════════════
                                            // 🛡️ USERNAME POISONING DETECTION
                                            // Reject tasks that start with username (injection artifacts)
                                            // ═══════════════════════════════════════════════════════════════════════
                                            const cookies = document.cookie.split(';').reduce((acc, c) => {
                                                const [k, v] = c.trim().split('=');
                                                acc[k] = decodeURIComponent(v || '');
                                                return acc;
                                            }, {});
                                            const usernamePrefix = cookies.NAME ? cookies.NAME.toLowerCase() : '';
                                            const taskNameLower = (existingTask.name || '').toLowerCase();

                                            // POISON CHECK: If task name starts with username, it's contaminated
                                            const isPoisoned = usernamePrefix && taskNameLower.startsWith(usernamePrefix);

                                            if (isPoisoned) {
                                                console.log(`[Session] 💀 POISONED: Purging username-contaminated task "${existingTask.name}"`);
                                                cursor.update(serverTask);
                                                count++;
                                                cursor.continue();
                                                return;
                                            }

                                            // Check if this is a real task or keystroke artifact
                                            // STRICT: Only preserve if name >= 3 chars AND has meaningful content
                                            const hasValidName = existingTask.name && existingTask.name.length >= 3;
                                            const hasDeadline = existingTask.deadline && existingTask.deadline !== 0;
                                            const hasNonDefaultProject = existingTask.projectId && existingTask.projectId !== '0' && existingTask.projectId !== 0;
                                            const hasPriority = existingTask.priority && existingTask.priority > 0;
                                            const hasTags = existingTask.tags && existingTask.tags.length > 0;
                                            const hasDescription = existingTask.description && existingTask.description.length > 0;

                                            // FIXED: Require BOTH valid name AND at least one other property
                                            // Removed dangerous length-only check that preserved poisoned tasks
                                            const isRealTask = hasValidName && (hasDeadline || hasNonDefaultProject || hasPriority || hasTags || hasDescription);

                                            if (isRealTask) {
                                                // Local task is dirty and real - PRESERVE IT
                                                console.log(`[Session] ⏭️ Preserving dirty task "${existingTask.name}" (sync:0)`);
                                                skipped++;
                                            } else {
                                                // Keystroke artifact - overwrite with server version
                                                console.log(`[Session] 🗑️ Removing keystroke artifact "${existingTask.name}"`);
                                                cursor.update(serverTask);
                                                count++;
                                            }
                                        } else {
                                            // Local task is clean - safe to overwrite with server version
                                            cursor.update(serverTask);
                                            count++;
                                        }
                                    }

                                    cursor.continue(); // Move to next task
                                } else {
                                    // Cursor finished - now add any NEW tasks from server
                                    serverTaskMap.forEach((serverTask, taskId) => {
                                        if (!processedIds.has(taskId)) {
                                            taskStore.add(serverTask);
                                            count++;
                                        }
                                    });

                                    console.log(`[Session] IDB: Updated ${count} tasks, preserved ${skipped} dirty tasks`);
                                }
                            };

                            cursorReq.onerror = () => {
                                console.error('[Session] Task cursor error:', cursorReq.error);
                            };
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

        // ═══════════════════════════════════════════════════════════════════════
        // 🔧 CRITICAL FIX: Recalculate Task Statistics from Pomodoro Logs
        // This fixes the "0m/NaN" bug after sync by ensuring task stats are derived
        // from actual pomodoro logs rather than relying on potentially stale values
        // ═══════════════════════════════════════════════════════════════════════
        recalculateTaskStats: function (tasks, pomodoros) {
            if (!Array.isArray(tasks) || !Array.isArray(pomodoros)) {
                console.warn('[Session] Cannot recalculate task stats - invalid input');
                return tasks;
            }

            console.log(`[Session] 🔄 Recalculating task stats from ${pomodoros.length} pomodoro logs...`);

            return tasks.map(task => {
                // Find all pomodoros for this task
                const taskPomos = pomodoros.filter(p => p.taskId === task.id);

                // Calculate actualPomoNum (count of completed pomodoros)
                const actualCount = taskPomos.length;
                task.actualPomoNum = actualCount;

                // ═══════════════════════════════════════════════════════════════
                // CRITICAL FIX: Calculate elapsed time with fallback logic
                // ═══════════════════════════════════════════════════════════════
                // Ensure pomodoroInterval exists FIRST (default 25 minutes = 1500 seconds)
                if (!task.pomodoroInterval || task.pomodoroInterval === 0) {
                    task.pomodoroInterval = 1500;
                }

                // Calculate total elapsed time from durations (in milliseconds)
                let totalDuration = 0;
                taskPomos.forEach((p, index) => {
                    console.log(`[Session] 🔍 Pomodoro #${index + 1} for "${task.name}": duration=${p.duration}, start=${p.startTime}, end=${p.endTime}`);

                    if (p.duration && p.duration > 0) {
                        // Use actual duration if available
                        console.log(`[Session]   ✅ Using actual duration: ${p.duration}ms`);
                        totalDuration += p.duration;
                    } else if (p.endTime && p.startTime && (p.endTime - p.startTime) > 0) {
                        // Calculate from startTime/endTime if duration is missing
                        const calculated = p.endTime - p.startTime;
                        console.log(`[Session]   ✅ Calculated from times: ${calculated}ms`);
                        totalDuration += calculated;
                    } else {
                        // Fallback: use task's pomodoroInterval (convert seconds to milliseconds)
                        const fallback = task.pomodoroInterval * 1000;
                        console.log(`[Session]   ⚠️ Using fallback (${task.pomodoroInterval}s): ${fallback}ms`);
                        totalDuration += fallback;
                    }
                });

                console.log(`[Session] 📊 Total duration for "${task.name}": ${totalDuration}ms = ${Math.floor(totalDuration / 1000 / 60)}m`);
                task.elapsedTime = Math.floor(totalDuration / 1000 / 60); // Convert to minutes

                // Ensure estimatePomoNum exists (preserve user's estimate, prevent NaN)
                if (task.estimatePomoNum === undefined || task.estimatePomoNum === null || isNaN(task.estimatePomoNum)) {
                    task.estimatePomoNum = 0;
                }

                if (actualCount > 0 || task.estimatePomoNum > 0) {
                    console.log(`[Session] Task "${task.name}": actualPomoNum=${task.actualPomoNum}, estimatePomoNum=${task.estimatePomoNum}, elapsedTime=${task.elapsedTime}m`);
                }

                return task;
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

                    // ═══════════════════════════════════════════════════════════════
                    // 🕒 TIME AUTHORITY FIX: Persist Server Timestamp
                    // ═══════════════════════════════════════════════════════════════
                    if (data.timestamp) {
                        try {
                            // main.js reads "SyncTimestamp" (capitalized)
                            localStorage.setItem('SyncTimestamp', data.timestamp);
                            console.log(`[Session] 🕒 Time Authority Replicant: Saved SyncTimestamp=${data.timestamp}`);

                            // Attempt explicit memory injection if possible
                            if (window.f && window.f.default && window.f.default.shared) {
                                window.f.default.shared.syncTimestamp = data.timestamp;
                            }
                        } catch (e) {
                            console.warn('[Session] Failed to persist Time Authority:', e);
                        }
                    }
                }

                // ═══════════════════════════════════════════════════════════════
                // CRITICAL: Preserve dirty tasks (sync: 0) in localStorage
                // ═══════════════════════════════════════════════════════════════
                if (data.tasks && data.tasks.length > 0) {
                    // ✅ CRITICAL FIX: Recalculate task stats from pomodoro logs FIRST
                    if (data.pomodoros && data.pomodoros.length > 0) {
                        console.log('[Session] 🔧 Recalculating task stats before merging...');
                        data.tasks = this.recalculateTaskStats(data.tasks, data.pomodoros);
                    }

                    // Read existing tasks and find dirty ones
                    const existingTasksStr = localStorage.getItem('pomodoro-tasks');
                    let existingTasks = [];
                    try {
                        existingTasks = existingTasksStr ? JSON.parse(existingTasksStr) : [];
                    } catch (e) {
                        existingTasks = [];
                    }

                    // Create map of dirty tasks (sync: 0), filtering out keystroke artifacts
                    const dirtyTasks = {};
                    let dirtyCount = 0;

                    existingTasks.forEach(t => {
                        if (t.sync === 0 && t.id) {
                            // STRICT: Only include real tasks, not keystroke artifacts
                            const isRealTask = (
                                (t.name && t.name.length >= 3) ||
                                (t.projectId && t.projectId !== '0') ||
                                t.deadline ||
                                t.priority
                            );

                            // ═══════════════════════════════════════════════════════════════════════
                            // 🛡️ USERNAME POISONING DETECTION (localStorage)
                            // ═══════════════════════════════════════════════════════════════════════
                            const usernamePrefix = this.getUsernamePrefix();
                            const taskNameLower = (t.name || '').toLowerCase();

                            // POISON CHECK: If task name starts with username, it's contaminated
                            const isPoisoned = usernamePrefix && taskNameLower.startsWith(usernamePrefix);

                            if (isPoisoned) {
                                console.log(`[Session] 💀 POISONED: Blocking username-contaminated task "${t.name}"`);
                                // Skip this poisoned task - don't preserve it
                            } else {
                                // BLOCK: Artifacts that look like partial usernames "d", "do", "its"
                                const hasValidProject = t.projectId && t.projectId !== '0';
                                const isArtifact = t.name && (
                                    t.name.length < 3 ||
                                    (t.name.length < 20 && !hasValidProject && !t.deadline)
                                );

                                if (isRealTask && !isArtifact) {
                                    dirtyTasks[t.id] = t;
                                    dirtyCount++;
                                } else {
                                    console.log(`[Session] 🛑 Blocking keystroke artifact: "${t.name}"`);
                                }
                            }
                        }
                    });

                    if (dirtyCount > 0) {
                        console.log(`[Session] ⚠️ localStorage: Found ${dirtyCount} dirty tasks - preserving them`);
                    }

                    // Merge server tasks, respecting local dirty state
                    const mergedTasks = data.tasks.map(serverTask => {
                        if (dirtyTasks[serverTask.id]) {
                            console.log(`[Session] ⏭️ localStorage: Keeping local dirty task "${serverTask.name}"`);
                            return dirtyTasks[serverTask.id]; // Keep local version
                        }
                        return serverTask;
                    });

                    // Add any dirty tasks that are NEW (not in server list yet)
                    Object.values(dirtyTasks).forEach(localTask => {
                        const exists = mergedTasks.find(t => t.id === localTask.id);
                        if (!exists) {
                            mergedTasks.push(localTask);
                        }
                    });

                    localStorage.setItem('pomodoro-tasks', JSON.stringify(mergedTasks));
                    console.log(`[Session] ✅ Saved ${mergedTasks.length} tasks (${dirtyCount} preserved dirty)`);
                }

                if (data.pomodoros && data.pomodoros.length > 0) {
                    localStorage.setItem('pomodoro-pomodoros', JSON.stringify(data.pomodoros));
                    console.log(`[Session] ✅ Saved ${data.pomodoros.length} pomodoros`);

                    // ✅ CRITICAL FIX: Dispatch storage event to trigger UI update
                    // This ensures React/main.js re-reads the updated task statistics
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: 'pomodoro-tasks',
                        newValue: localStorage.getItem('pomodoro-tasks'),
                        url: window.location.href,
                        storageArea: localStorage
                    }));
                    console.log('[Session] ✅ Dispatched storage event to trigger UI update');
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
