// ✅ DUAL-MODE SESSION MANAGER (Cookie + Token Fallback)
(function () {
    'use strict';

    const SessionManager = {
        currentUser: null,
        token: null,

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
                // ✅ DUAL-MODE REQUEST
                const headers = {
                    'Content-Type': 'application/json'
                };

                // Add token if we have it
                if (this.token) {
                    headers['X-Session-Token'] = this.token;
                }

                const response = await fetch('http://localhost:3000/v64/user/config', {
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
                    console.log('[Session] ✅ Authenticated:', data.user.email);
                } else {
                    this.handleLoggedOut();
                }
            } catch (error) {
                console.error('[Session] Check failed:', error);
                this.handleLoggedOut();
            }
        },

        handleLoggedOut: function () {
            this.currentUser = null;
            this.token = null;
            localStorage.removeItem('authToken');
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
                }
                if (loginBtn) loginBtn.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'block';

                // Sync with legacy cookies (for main.js compatibility)
                document.cookie = `NAME=${encodeURIComponent(username)}; path=/; max-age=86400`;

                console.log('[Session] UI updated for:', username);
            } else {
                if (userDisplay) {
                    userDisplay.textContent = 'Not logged in';
                    userDisplay.removeAttribute('data-user-name');
                }
                if (loginBtn) loginBtn.style.display = 'block';
                if (logoutBtn) logoutBtn.style.display = 'none';
            }
        },

        setupHandlers: function () {
            // Logout handler
            const logoutBtn = document.querySelector('.logout-btn, #logout-button');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.logout());
            }
        },

        logout: async function () {
            try {
                await fetch('http://localhost:3000/v63/user/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (e) {
                console.error('[Session] Logout error:', e);
            }

            this.handleLoggedOut();
            window.location.reload();
        },

        // ✅ HELPER: Get auth headers for other modules
        getAuthHeaders: function () {
            const headers = {};
            if (this.token) {
                headers['X-Session-Token'] = this.token;
            }
            return headers;
        }
    };

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SessionManager.init());
    } else {
        SessionManager.init();
    }

    // Export globally
    window.SessionManager = SessionManager;

    console.log('[Session] Manager loaded - Dual-mode auth ready');
})();
