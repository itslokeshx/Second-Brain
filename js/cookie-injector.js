// Cookie Injector - Monitors login responses and verifies cookies
(function () {
    'use strict';

    console.log('[Cookie Injector] Monitoring login responses...');

    // Intercept fetch responses
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);

        // Clone response to read it
        const clonedResponse = response.clone();

        try {
            const url = args[0];
            if (typeof url === 'string' && (url.includes('/login') || url.includes('/register'))) {
                const data = await clonedResponse.json();

                if (data.status === 0 && data.acct) {
                    console.log('[Cookie Injector] Login detected');
                    console.log('[Cookie Injector] Response data:', {
                        acct: data.acct,
                        name: data.name,
                        uid: data.uid
                    });

                    // Wait a bit for backend cookies to be set
                    setTimeout(() => {
                        const cookies = document.cookie;
                        console.log('[Cookie Injector] Current cookies:', cookies);

                        // Check if cookies were set by backend
                        if (!cookies.includes('NAME=')) {
                            console.warn('[Cookie Injector] NAME cookie missing, setting manually');
                            document.cookie = `NAME=${encodeURIComponent(data.name || data.acct.split('@')[0])}; path=/; max-age=86400`;
                        }
                        if (!cookies.includes('ACCT=')) {
                            console.warn('[Cookie Injector] ACCT cookie missing, setting manually');
                            document.cookie = `ACCT=${encodeURIComponent(data.acct)}; path=/; max-age=86400`;
                        }
                        if (!cookies.includes('UID=')) {
                            console.warn('[Cookie Injector] UID cookie missing, setting manually');
                            document.cookie = `UID=${data.uid}; path=/; max-age=86400`;
                        }

                        console.log('[Cookie Injector] Final cookies:', document.cookie);
                    }, 100);
                }
            }
        } catch (e) {
            // Ignore JSON parse errors
        }

        return response;
    };
})();
