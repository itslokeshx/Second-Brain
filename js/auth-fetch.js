/**
 * Centralized Authentication Request Wrapper
 * ═══════════════════════════════════════════════════════════════════════════
 * AUTHORITY: Single source of truth for authenticated API requests
 * FIXES: Fragmented auth across 5+ files, inconsistent header attachment
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    window.AuthFetch = {
        /**
         * Get authentication token from storage
         * Priority: localStorage > SessionManager > empty
         */
        getToken: function () {
            return localStorage.getItem('authToken') ||
                window.SessionManager?.token ||
                '';
        },

        /**
         * Centralized authenticated request
         * Automatically attaches auth headers to ALL requests
         */
        async request(url, options = {}) {
            const token = this.getToken();

            // Build headers with auth
            const headers = {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            };

            // Attach token in BOTH formats for backend compatibility
            if (token) {
                headers['X-Session-Token'] = token;
                headers['Authorization'] = `Bearer ${token}`;
            }

            const fetchOptions = {
                ...options,
                credentials: 'include', // Always send cookies
                headers
            };

            console.log(`[AuthFetch] ${options.method || 'GET'} ${url}`);
            console.log(`[AuthFetch] Token: ${token ? token.substring(0, 10) + '...' : 'NONE'}`);

            try {
                const response = await fetch(url, fetchOptions);

                // Handle 401 Unauthorized - session expired
                if (response.status === 401) {
                    console.error('[AuthFetch] ❌ 401 Unauthorized - Session expired');

                    // CRITICAL: Don't redirect if we're already in logout state
                    // Check for ?logout=1 parameter to prevent infinite loop
                    const isAlreadyLoggingOut = window.location.search.includes('logout=1');

                    if (isAlreadyLoggingOut) {
                        console.log('[AuthFetch] ⏭️ Already in logout state - skipping redirect');
                        throw new Error('Session expired - please login again');
                    }

                    // Trigger logout
                    if (window.SessionManager?.handleLoggedOut) {
                        console.log('[AuthFetch] Triggering logout...');
                        window.SessionManager.handleLoggedOut();

                        // Redirect to login after short delay
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 1000);
                    }

                    throw new Error('Session expired - please login again');
                }

                return response;
            } catch (error) {
                console.error(`[AuthFetch] Request failed:`, error);
                throw error;
            }
        },

        /**
         * GET request
         */
        async get(url, options = {}) {
            return this.request(url, { ...options, method: 'GET' });
        },

        /**
         * POST request
         */
        async post(url, data, options = {}) {
            return this.request(url, {
                ...options,
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        /**
         * PUT request
         */
        async put(url, data, options = {}) {
            return this.request(url, {
                ...options,
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        /**
         * DELETE request
         */
        async delete(url, options = {}) {
            return this.request(url, { ...options, method: 'DELETE' });
        },

        /**
         * Check if user is authenticated
         */
        isAuthenticated: function () {
            const token = this.getToken();
            return !!token && token.length > 0;
        }
    };

    console.log('[AuthFetch] ✅ Centralized auth wrapper loaded');
    console.log('[AuthFetch] Token available:', window.AuthFetch.isAuthenticated());

})();
