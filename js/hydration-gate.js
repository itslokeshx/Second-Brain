/**
 * Hydration Gate
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL: This script BLOCKS main.js from loading until data is ready.
 * 
 * Purpose:
 * 1. Validate user session
 * 2. Ensure IndexedDB is hydrated with data
 * 3. Set hydration flag to prevent redundant loads
 * 4. Signal readiness to main.js
 * 
 * This prevents the blank UI issue caused by main.js rendering before data exists.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    console.log('[Hydration Gate] 🚦 Initializing...');

    /**
     * Main hydration check - returns promise that resolves when ready
     */
    window.__HYDRATION_COMPLETE__ = (async () => {
        try {
            // Step 1: Check if user has auth token
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                console.log('[Hydration Gate] ❌ No auth token - user not logged in');
                return { ready: false, reason: 'no-auth' };
            }

            console.log('[Hydration Gate] ✅ Auth token found');

            // Step 2: Validate session with server
            const apiUrl = window.AppConfig
                ? window.AppConfig.getApiUrl('/v64/user/config')
                : 'http://localhost:3000/v64/user/config';

            let user = null;
            try {
                const response = await fetch(apiUrl, {
                    credentials: 'include',
                    headers: {
                        'X-Session-Token': authToken,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    console.log('[Hydration Gate] ❌ Session invalid - clearing storage');
                    localStorage.clear();
                    sessionStorage.clear();
                    return { ready: false, reason: 'invalid-session' };
                }

                const data = await response.json();
                user = data.user;

                if (!user || !user.id) {
                    console.log('[Hydration Gate] ❌ No user in response');
                    return { ready: false, reason: 'no-user' };
                }

                console.log('[Hydration Gate] ✅ Session valid for user:', user.id);
            } catch (error) {
                console.error('[Hydration Gate] ❌ Session validation failed:', error);
                return { ready: false, reason: 'validation-error' };
            }

            const userId = user.id;

            // Store userId for other scripts
            localStorage.setItem('userId', userId);

            // ═══════════════════════════════════════════════════════════════════════
            // Initialize Guardian now that we have a userId
            // This will seed system projects into the user-scoped database
            // ═══════════════════════════════════════════════════════════════════════
            if (window.IndexedDBGuardian && !window.IndexedDBGuardian.isInitialized) {
                try {
                    console.log('[Hydration Gate] 🛡️ Initializing Guardian for user...');
                    await window.IndexedDBGuardian.initialize();
                    console.log('[Hydration Gate] ✅ Guardian initialized');
                } catch (error) {
                    console.error('[Hydration Gate] ⚠️ Guardian initialization failed:', error);
                    // Continue anyway - not critical
                }
            }

            // Step 3: ALWAYS wait for Guardian to finish initializing
            // Even if we're already hydrated, Guardian needs to seed system projects
            if (window.IndexedDBGuardian) {
                let waitCount = 0;
                while (!window.IndexedDBGuardian.isInitialized && waitCount < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    waitCount++;
                }
                if (window.IndexedDBGuardian.isInitialized) {
                    console.log('[Hydration Gate] ✅ Guardian ready');
                } else {
                    console.warn('[Hydration Gate] ⚠️ Guardian timeout - proceeding anyway');
                }
            }

            // Step 4: Check if already hydrated this session
            const hydrationKey = 'hydrated_' + userId;
            if (sessionStorage.getItem(hydrationKey)) {
                console.log('[Hydration Gate] ✅ Already hydrated this session');
                return { ready: true, userId, reason: 'already-hydrated' };
            }

            // Step 4: Check if IndexedDB has data
            const hasData = await checkIndexedDBHasData(userId);
            if (hasData) {
                console.log('[Hydration Gate] ✅ IndexedDB already has data');
                sessionStorage.setItem(hydrationKey, 'true');
                return { ready: true, userId, reason: 'data-exists' };
            }

            // Step 5: Fetch and hydrate from server
            console.log('[Hydration Gate] 📥 Fetching data from server...');

            if (!window.SyncService) {
                console.error('[Hydration Gate] ❌ SyncService not available');
                return { ready: false, reason: 'no-sync-service' };
            }

            try {
                const data = await window.SyncService.loadAll();

                if (!data || (!data.projects?.length && !data.tasks?.length)) {
                    console.log('[Hydration Gate] ⚠️ No data from server (new account?)');
                    // Still mark as hydrated to prevent infinite loop
                    sessionStorage.setItem(hydrationKey, 'true');
                    return { ready: true, userId, reason: 'no-server-data' };
                }

                console.log('[Hydration Gate] 📦 Received data:', {
                    projects: data.projects?.length || 0,
                    tasks: data.tasks?.length || 0
                });

                // Write to IndexedDB
                if (window.SessionManager && window.SessionManager.saveToIndexedDB) {
                    await window.SessionManager.saveToIndexedDB(data);
                    console.log('[Hydration Gate] ✅ Saved to IndexedDB');
                }

                // Write to localStorage
                if (window.SessionManager && window.SessionManager.saveToLocalStorage) {
                    window.SessionManager.saveToLocalStorage(data);
                    console.log('[Hydration Gate] ✅ Saved to localStorage');
                }

                // Mark as hydrated
                sessionStorage.setItem(hydrationKey, 'true');
                console.log('[Hydration Gate] ✅ Hydration complete');

                return { ready: true, userId, reason: 'freshly-hydrated' };

            } catch (error) {
                console.error('[Hydration Gate] ❌ Hydration failed:', error);
                return { ready: false, reason: 'hydration-error', error };
            }

        } catch (error) {
            console.error('[Hydration Gate] ❌ Critical error:', error);
            return { ready: false, reason: 'critical-error', error };
        }
    })();

    /**
     * Check if IndexedDB has data for this user
     */
    async function checkIndexedDBHasData(userId) {
        try {
            if (!window.UserDB) {
                console.warn('[Hydration Gate] UserDB not available');
                return false;
            }

            const db = await window.UserDB.openUserDB(userId);
            const tx = db.transaction('Project', 'readonly');
            const count = await new Promise((resolve, reject) => {
                const req = tx.objectStore('Project').count();
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });

            console.log('[Hydration Gate] IndexedDB project count:', count);
            return count > 0;

        } catch (error) {
            console.error('[Hydration Gate] Error checking IndexedDB:', error);
            return false;
        }
    }

    console.log('[Hydration Gate] 📦 Hydration gate loaded - promise created');

})();
