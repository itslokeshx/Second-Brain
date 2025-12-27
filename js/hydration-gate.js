/**
 * Hydration Gate - Uses HydrationMutex for Atomic Data Loading
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL: This script BLOCKS main.js from loading until data is ready.
 * 
 * Now uses HydrationMutex state machine for deterministic cold-start behavior.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    console.log('[Hydration Gate] 🚦 Initializing...');

    /**
     * Main hydration check - uses mutex for atomic state transitions
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

            // Step 2: Get userId from localStorage OR cookies
            let userId = localStorage.getItem('userId');

            // If not in localStorage, try to get from cookies
            if (!userId) {
                const cookies = document.cookie.split(';');
                for (let cookie of cookies) {
                    const [name, value] = cookie.trim().split('=');
                    if (name === 'UID') {
                        userId = value;
                        // Save to localStorage for next time
                        localStorage.setItem('userId', userId);
                        console.log('[Hydration Gate] ✅ Synced userId from cookie to localStorage:', userId);
                        break;
                    }
                }
            }

            if (!userId) {
                console.log('[Hydration Gate] ❌ No userId - invalid state');
                localStorage.clear();
                return { ready: false, reason: 'no-userid' };
            }

            console.log('[Hydration Gate] ✅ User ID:', userId);

            // Step 3: Use HydrationMutex for atomic hydration
            // This ensures deterministic state transitions
            if (!window.HydrationMutex) {
                console.error('[Hydration Gate] ❌ HydrationMutex not available');
                return { ready: false, reason: 'no-mutex' };
            }

            console.log('[Hydration Gate] 🔒 Acquiring hydration mutex...');

            try {
                const result = await window.HydrationMutex.acquire(userId);

                if (result.success && result.state === 'READY') {
                    console.log('[Hydration Gate] ✅ Hydration complete via mutex');
                    return { ready: true, userId, reason: 'mutex-success' };
                } else {
                    console.error('[Hydration Gate] ❌ Mutex returned non-ready state:', result);
                    return { ready: false, reason: 'mutex-not-ready' };
                }
            } catch (error) {
                console.error('[Hydration Gate] ❌ Mutex acquisition failed:', error);
                return { ready: false, reason: 'mutex-error', error };
            }

        } catch (error) {
            console.error('[Hydration Gate] ❌ Critical error:', error);
            return { ready: false, reason: 'critical-error', error };
        }
    })();

    console.log('[Hydration Gate] 📦 Hydration gate loaded - using mutex');

})();
