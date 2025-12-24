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
                    console.log('[Session] 💾 Using local data - click sync to load from server');
                } else if (cookieUser) {
                    // ✅ FALLBACK: Use cookie data if API doesn't return user
                    console.log('[Session] Using cookie-based auth:', cookieUser.email);
                    this.currentUser = cookieUser;
                    this.token = cookieUser.sessionId;
                    if (this.token) {
                        localStorage.setItem('authToken', this.token);
                    }
                    this.updateUI(true, cookieUser.email);
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
                } else {
                    this.handleLoggedOut();
                }
            }
        },

        // ✅ NEW: Extract user from cookies
        getUserFromCookies: function () {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = decodeURIComponent(value);
                return acc;
            }, {});

            // Check if we have user cookies AND they're not literally "undefined"
            if (cookies.ACCT && cookies.UID &&
                cookies.ACCT !== 'undefined' && cookies.UID !== 'undefined') {
                return {
                    email: cookies.ACCT,
                    id: cookies.UID,
                    username: cookies.NAME && cookies.NAME !== 'undefined' ? cookies.NAME : cookies.ACCT.split('@')[0],
                    sessionId: cookies.JSESSIONID && cookies.JSESSIONID !== 'undefined' ? cookies.JSESSIONID : (cookies['secondbrain.token'] || null)
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
                    console.log('[Session] No data to restore');
                    return;
                }

                // Write to IndexedDB
                const dbName = 'PomodoroDB6';
                const dbRequest = indexedDB.open(dbName, 1);

                dbRequest.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('projects')) {
                        db.createObjectStore('projects', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('tasks')) {
                        db.createObjectStore('tasks', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('pomodoros')) {
                        db.createObjectStore('pomodoros', { keyPath: 'id' });
                    }
                };

                dbRequest.onsuccess = () => {
                    const db = dbRequest.result;
                    const tx = db.transaction(['projects', 'tasks', 'pomodoros'], 'readwrite');

                    // Clear and restore projects
                    const projectStore = tx.objectStore('projects');
                    projectStore.clear();
                    (data.projects || []).forEach(p => {
                        try {
                            projectStore.add(p);
                        } catch (e) {
                            console.warn('[Session] Failed to add project:', e);
                        }
                    });

                    // Clear and restore tasks
                    const taskStore = tx.objectStore('tasks');
                    taskStore.clear();
                    (data.tasks || []).forEach(t => {
                        try {
                            taskStore.add(t);
                        } catch (e) {
                            console.warn('[Session] Failed to add task:', e);
                        }
                    });

                    // Clear and restore pomodoros
                    const pomodoroStore = tx.objectStore('pomodoros');
                    pomodoroStore.clear();
                    (data.pomodoros || []).forEach(p => {
                        try {
                            pomodoroStore.add(p);
                        } catch (e) {
                            console.warn('[Session] Failed to add pomodoro:', e);
                        }
                    });

                    tx.oncomplete = () => {
                        console.log('[Session] ✅ Data restored to IndexedDB');
                        console.log(`  Projects: ${data.projects?.length || 0}`);
                        console.log(`  Tasks: ${data.tasks?.length || 0}`);
                        console.log(`  Pomodoros: ${data.pomodoros?.length || 0}`);

                        // Force UI refresh after a short delay
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                    };
                };

                dbRequest.onerror = (error) => {
                    console.error('[Session] IndexedDB error:', error);
                };
            } catch (error) {
                console.error('[Session] Data load failed:', error);
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
