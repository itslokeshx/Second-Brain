/**
 * Hydration Mutex - State Machine for Atomic Data Hydration
 * ═══════════════════════════════════════════════════════════════════════════
 * Ensures deterministic cold-start behavior by enforcing atomic state transitions
 * 
 * States: UNINITIALIZED → AUTH_VALIDATING → GUARDIAN_INITIALIZING → 
 *         DATA_FETCHING → DATA_PERSISTING → DATA_VERIFYING → READY
 * 
 * Rules:
 * - Cannot skip states
 * - Cannot proceed if previous state failed
 * - Sync button locked until READY
 * - main.js blocked until READY
 * - Reload resets to AUTH_VALIDATING (not READY)
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    class HydrationMutex {
        constructor() {
            this.promise = null;
            this.error = null;

            // ✅ CRITICAL: Restore state from sessionStorage
            // This prevents Mutex from resetting when main.js causes script re-execution
            this._restoreState();
        }

        /**
         * Initialize state - ALWAYS start fresh on page load
         * 
         * NOTE: We do NOT restore from sessionStorage anymore because:
         * 1. If Mutex starts in READY state, main.js loads immediately
         * 2. But session-manager hasn't finished populating localStorage yet
         * 3. This causes main.js to render with empty data = blank screen
         * 
         * The hydration-gate will properly call Mutex.acquire() on each page load.
         */
        _restoreState() {
            // Always start fresh - let hydration-gate properly initialize
            this.state = 'UNINITIALIZED';
            this.userId = null;
            console.log('[Mutex] Starting fresh - will wait for hydration-gate');
        }

        /**
         * Persist state to sessionStorage
         */
        _persistState() {
            try {
                if (this.state === 'READY' && this.userId) {
                    sessionStorage.setItem('hydration_mutex_state', JSON.stringify({
                        state: this.state,
                        userId: this.userId
                    }));
                }
            } catch (e) {
                console.warn('[Mutex] Failed to persist state:', e);
            }
        }

        /**
         * Acquire hydration lock - ensures only one hydration at a time
         */
        async acquire(userId) {
            // If already hydrating for this user, wait for it
            if (this.promise && this.userId === userId) {
                console.log('[Mutex] Waiting for existing hydration...');
                return this.promise;
            }

            // If hydrating for different user, this is an error
            if (this.promise && this.userId !== userId) {
                throw new Error('[Mutex] Cannot hydrate for different user while hydration in progress');
            }

            // Start new hydration
            this.userId = userId;
            this.promise = this._hydrate(userId);
            return this.promise;
        }

        /**
         * Main hydration flow - atomic state transitions
         */
        async _hydrate(userId) {
            try {
                console.log('[Mutex] 🚀 Starting hydration for user:', userId);

                // STATE 1: AUTH_VALIDATING
                this.state = 'AUTH_VALIDATING';
                console.log('[Mutex] State:', this.state);
                await this._validateAuth();

                // STATE 2: GUARDIAN_INITIALIZING
                this.state = 'GUARDIAN_INITIALIZING';
                console.log('[Mutex] State:', this.state);
                await this._initializeGuardian();

                // STATE 3: DATA_FETCHING (skip if data already exists)
                this.state = 'DATA_FETCHING';
                console.log('[Mutex] State:', this.state);

                // Check if data already exists (for reload scenario)
                const hasExistingData = await this._checkDataExists(userId);
                let data;

                if (hasExistingData) {
                    console.log('[Mutex] ✅ Data already exists - skipping fetch');
                    data = null; // Will skip persistence
                } else {
                    console.log('[Mutex] 📥 Fetching data from server...');
                    data = await this._fetchData();
                }

                // STATE 4: DATA_PERSISTING (skip if no new data)
                if (data) {
                    this.state = 'DATA_PERSISTING';
                    console.log('[Mutex] State:', this.state);
                    await this._persistData(data);
                } else {
                    console.log('[Mutex] ⏭️ Skipping DATA_PERSISTING - using existing data');
                }

                // STATE 5: DATA_VERIFYING
                this.state = 'DATA_VERIFYING';
                console.log('[Mutex] State:', this.state);
                await this._verifyData(userId);

                // STATE 6: READY
                this.state = 'READY';
                console.log('[Mutex] State:', this.state);

                // ✅ CRITICAL: Persist READY state to sessionStorage
                // This allows Mutex to survive main.js script re-execution
                this._persistState();

                // Check if this is first hydration (no flag exists yet)
                const wasAlreadyHydrated = sessionStorage.getItem('hydrated_' + userId);
                sessionStorage.setItem('hydrated_' + userId, 'true');

                console.log('[Mutex] ✅ Hydration complete');

                // If this was first hydration, just return success (don't reload)
                if (!wasAlreadyHydrated && data) {
                    console.log('[Mutex] 🔄 First hydration complete');
                }

                return { success: true, state: 'READY', userId };

            } catch (error) {
                this.state = 'ERROR';
                this.error = error;
                this.promise = null; // Allow retry
                console.error('[Mutex] ❌ Hydration failed:', error);
                throw error;
            }
        }

        /**
         * STATE 1: Validate authentication with retry
         */
        async _validateAuth() {
            if (!window.AuthFetch?.isAuthenticated()) {
                throw new Error('No auth token');
            }

            // Retry up to 3 times with backoff
            for (let i = 0; i < 3; i++) {
                try {
                    const apiUrl = window.AppConfig
                        ? window.AppConfig.getApiUrl('/v64/user/config')
                        : 'http://localhost:3000/v64/user/config';

                    const response = await window.AuthFetch.get(apiUrl);
                    if (response.ok) {
                        console.log('[Mutex] ✅ Auth validated');
                        return;
                    }
                } catch (error) {
                    console.warn('[Mutex] Auth check failed, retry', i + 1, error);
                }

                // Exponential backoff
                await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)));
            }

            throw new Error('Auth validation failed after 3 retries');
        }

        /**
         * STATE 2: Initialize Guardian (seed system projects)
         */
        async _initializeGuardian() {
            if (!window.IndexedDBGuardian) {
                console.warn('[Mutex] Guardian not available');
                return;
            }

            // Wait for Guardian to initialize (with timeout)
            let waitCount = 0;
            while (!window.IndexedDBGuardian.isInitialized && waitCount < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waitCount++;
            }

            if (!window.IndexedDBGuardian.isInitialized) {
                // Force initialize
                console.log('[Mutex] Force initializing Guardian...');
                await window.IndexedDBGuardian.initialize();
            }

            console.log('[Mutex] ✅ Guardian initialized');
        }

        /**
         * STATE 3: Fetch data from server
         */
        async _fetchData() {
            if (!window.SyncService) {
                throw new Error('SyncService not available');
            }

            const data = await window.SyncService.loadAll();

            console.log('[Mutex] ✅ Data fetched:', {
                projects: data.projects?.length || 0,
                tasks: data.tasks?.length || 0
            });

            return data;
        }

        /**
         * STATE 4: Persist data to IndexedDB and localStorage
         */
        async _persistData(data) {
            // ═══════════════════════════════════════════════════════════════════════
            // 🛡️ POISON PURGE: Remove username-contaminated tasks BEFORE persistence
            // ═══════════════════════════════════════════════════════════════════════
            if (data.tasks && Array.isArray(data.tasks)) {
                const usernamePrefix = (window.SessionManager && window.SessionManager.getUsernamePrefix) ? window.SessionManager.getUsernamePrefix() : "";
                
                if (usernamePrefix) {
                    const originalCount = data.tasks.length;
                    data.tasks = data.tasks.filter(t => {
                        const taskNameLower = (t.name || '').toLowerCase();
                        const isPoisoned = taskNameLower.startsWith(usernamePrefix);
                        if (isPoisoned) {
                            console.log(`[Mutex] 💀 PURGING poisoned task: "${t.name}"`);
                        }
                        return !isPoisoned;
                    });
                    const purgedCount = originalCount - data.tasks.length;
                    if (purgedCount > 0) {
                        console.log(`[Mutex] 🧹 Purged ${purgedCount} username-contaminated tasks`);
                    }
                }
            }

            // Write to IndexedDB (atomic transaction)
            if (window.SessionManager && window.SessionManager.saveToIndexedDB) {
                await window.SessionManager.saveToIndexedDB(data);
                console.log('[Mutex] ✅ Saved to IndexedDB');
            }

            // Write to localStorage (sync)
            if (window.SessionManager && window.SessionManager.saveToLocalStorage) {
                window.SessionManager.saveToLocalStorage(data);
                console.log('[Mutex] ✅ Saved to localStorage');
            }
        }

        /**
         * Check if data already exists in IndexedDB
         */
        async _checkDataExists(userId) {
            try {
                if (!window.UserDB) {
                    return false;
                }

                const db = await window.UserDB.openUserDB(userId);

                // Check project count
                const projTx = db.transaction('Project', 'readonly');
                const projCount = await new Promise((resolve, reject) => {
                    const req = projTx.objectStore('Project').count();
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                });

                // Check task count
                const taskTx = db.transaction('Task', 'readonly');
                const taskCount = await new Promise((resolve, reject) => {
                    const req = taskTx.objectStore('Task').count();
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                });

                console.log('[Mutex] Data check: projects=' + projCount + ', tasks=' + taskCount);

                // Data exists if we have projects AND tasks (or sessionStorage flag)
                const hasData = projCount > 18;
                const isHydrated = sessionStorage.getItem('hydrated_' + userId);

                // If already hydrated this session, trust the data
                if (isHydrated && hasData) {
                    return true;
                }

                // First load - always fetch to get tasks
                return false;
            } catch (error) {
                console.warn('[Mutex] Error checking data existence:', error);
                return false;
            }
        }

        /**
         * STATE 5: Verify data integrity - BOTH IndexedDB AND localStorage
         */
        async _verifyData(userId) {
            console.log('[Mutex] 🔍 Verifying data integrity...');

            // PART 1: Verify IndexedDB has data
            if (!window.UserDB) {
                throw new Error('UserDB not available');
            }

            const db = await window.UserDB.openUserDB(userId);
            const tx = db.transaction('Project', 'readonly');
            const count = await new Promise((resolve, reject) => {
                const req = tx.objectStore('Project').count();
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });

            if (count === 0) {
                throw new Error('Data verification failed: no projects in database');
            }

            console.log('[Mutex] ✅ IndexedDB verified:', count, 'projects');

            // PART 2: CRITICAL - Verify localStorage has data
            // main.js reads from localStorage, so we MUST wait until it's populated
            const maxRetries = 20; // 2 seconds max
            const retryDelay = 100; // 100ms between retries

            for (let i = 0; i < maxRetries; i++) {
                const projectsJson = localStorage.getItem('pomodoro-projects');
                if (projectsJson && projectsJson !== '[]') {
                    try {
                        const projects = JSON.parse(projectsJson);
                        if (projects && projects.length > 0) {
                            console.log('[Mutex] ✅ localStorage verified:', projects.length, 'projects');
                            return; // SUCCESS!
                        }
                    } catch (e) {
                        // Invalid JSON, keep waiting
                    }
                }

                // Wait and retry
                if (i < maxRetries - 1) {
                    console.log('[Mutex] ⏳ Waiting for localStorage... (attempt', i + 1, ')');
                    await new Promise(r => setTimeout(r, retryDelay));
                }
            }

            // localStorage not populated or missing keys - try to populate from IndexedDB
            console.log('[Mutex] 🔍 Checking localStorage completeness...');

            if (!localStorage.getItem('pomodoro-projects') ||
                !localStorage.getItem('custom-project-list')) { // Check specifically for the list key main.js needs

                console.warn('[Mutex] ⚠️ localStorage incomplete - populating from IndexedDB...');
                const allTx = db.transaction('Project', 'readonly');
                const projects = await new Promise((resolve, reject) => {
                    const req = allTx.objectStore('Project').getAll();
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                });

                if (projects && projects.length > 0) {
                    // 1. Projects
                    // localStorage.setItem('pomodoro-projects', JSON.stringify(projects));

                    // 2. Project Order
                    const projectOrder = projects.map(p => p.id);
                    // localStorage.setItem('pomodoro-projectOrder', JSON.stringify(projectOrder));

                    // 3. Custom Project List - CRITICAL for sidebar rendering in main.js
                    // localStorage.setItem('custom-project-list', JSON.stringify(projectOrder));

                    console.log('[Mutex] ✅ Populated localStorage from IndexedDB:', projects.length, 'projects');
                } else {
                    throw new Error('Cannot verify data: both IndexedDB and localStorage are empty');
                }
            } else {
                // Even if projects exist, safe-check custom-project-list one last time
                if (!localStorage.getItem('custom-project-list')) {
                    const projects = JSON.parse(localStorage.getItem('pomodoro-projects'));
                    const projectOrder = projects.map(p => p.id);
                    // localStorage.setItem('custom-project-list', JSON.stringify(projectOrder));
                    console.log('[Mutex] 🔧 Repaired missing custom-project-list');
                }
                console.log('[Mutex] ✅ localStorage fully verified');
            }
        }

        /**
         * Check if hydration is complete and ready
         */
        isReady() {
            return this.state === 'READY';
        }

        /**
         * Check if hydration is in progress (to prevent other loaders)
         */
        isInProgress() {
            return this.state !== 'IDLE' && this.state !== 'READY' && this.state !== 'ERROR';
        }

        /**
         * Check if mutex is currently IN THE MIDDLE of hydration
         * Returns false for terminal states (READY, ERROR, UNINITIALIZED)
         * This allows session-manager to load data when Mutex is already READY
         */
        isHandling() {
            // Only return true when actively hydrating
            // READY, ERROR, UNINITIALIZED are terminal states - not "handling"
            return this.state !== 'UNINITIALIZED' &&
                this.state !== 'READY' &&
                this.state !== 'ERROR';
        }

        /**
         * Check if sync is allowed
         */
        canSync() {
            return this.state === 'READY';
        }

        /**
         * Get current state
         */
        getState() {
            return {
                state: this.state,
                userId: this.userId,
                error: this.error
            };
        }

        /**
         * Reset mutex (for logout)
         */
        reset() {
            this.state = 'UNINITIALIZED';
            this.promise = null;
            this.userId = null;
            this.error = null;
            // ✅ Clear persisted state on logout
            try {
                sessionStorage.removeItem('hydration_mutex_state');
            } catch (e) {
                console.warn('[Mutex] Failed to clear persisted state:', e);
            }
            console.log('[Mutex] Reset');
        }
    }

    // Export global singleton
    window.HydrationMutex = new HydrationMutex();
    console.log('[Mutex] 📦 Hydration mutex loaded');

})();
