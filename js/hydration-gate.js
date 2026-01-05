(function () {
    'use strict';


    /**
     * Main hydration check - uses mutex for atomic state transitions
     */
    window.__HYDRATION_COMPLETE__ = (async () => {
        try {
            // Step 1: Check if user has auth token
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                return { ready: false, reason: 'no-auth' };
            }


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
                        break;
                    }
                }
            }

            if (!userId) {
                localStorage.clear();
                return { ready: false, reason: 'no-userid' };
            }


            // Step 3: Use HydrationMutex for atomic hydration
            // Wait for mutex to load (it might not be ready immediately)
            let mutex = window.HydrationMutex;
            let retries = 0;
            const maxRetries = 20; // 20 * 100ms = 2 seconds max wait

            while (!mutex && retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 100));
                mutex = window.HydrationMutex;
                retries++;
            }

            if (!mutex) {
                console.error('[Hydration Gate] ❌ HydrationMutex not available after waiting');
                return { ready: false, reason: 'no-mutex' };
            }



            try {
                const result = await mutex.acquire(userId);

                if (result.success && result.state === 'READY') {
                    return { ready: true, userId, reason: 'mutex-success' };
                } else {
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


})();
