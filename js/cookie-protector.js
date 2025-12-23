// Cookie Protector - Prevents main.js from deleting or corrupting NAME/ACCT cookies
// This MUST load BEFORE main.js
(function () {
    'use strict';

    console.log('[Cookie Protector] Initializing...');

    // Store protected cookie values
    const protectedCookies = {};

    // Get the original cookie descriptor
    const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
        Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');

    if (!originalDescriptor) {
        console.error('[Cookie Protector] Cannot find cookie descriptor!');
        return;
    }

    // Override the cookie setter to protect NAME and ACCT
    Object.defineProperty(Document.prototype, 'cookie', {
        get: function () {
            let cookies = originalDescriptor.get.call(this);

            // Inject protected cookies if they're missing
            Object.keys(protectedCookies).forEach(key => {
                if (!cookies.includes(`${key}=`)) {
                    cookies += `; ${key}=${protectedCookies[key]}`;
                }
            });

            return cookies;
        },
        set: function (value) {
            // Parse the cookie being set
            const [cookiePair] = value.split(';');
            const [key, val] = cookiePair.split('=');

            // If it's NAME or ACCT, store it as protected
            if (key === 'NAME' || key === 'ACCT' || key === 'UID') {
                console.log(`[Cookie Protector] Protecting ${key}=${val}`);
                protectedCookies[key] = val;
            }

            // If main.js tries to delete NAME/ACCT (by setting empty value), block it
            if ((key === 'NAME' || key === 'ACCT' || key === 'UID') && (!val || val === 'undefined')) {
                console.warn(`[Cookie Protector] Blocked attempt to delete/corrupt ${key}`);
                return; // Don't actually set it
            }

            // Otherwise, allow the cookie to be set normally
            originalDescriptor.set.call(this, value);
        },
        configurable: true
    });

    // Monitor for login responses and protect cookies immediately
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        const clonedResponse = response.clone();

        try {
            const url = args[0];
            if (typeof url === 'string' && (url.includes('/login') || url.includes('/register'))) {
                const data = await clonedResponse.json();

                if (data.status === 0 && data.acct) {
                    console.log('[Cookie Protector] Login detected, protecting user cookies');

                    // Wait for backend to set cookies
                    setTimeout(() => {
                        // Protect these values
                        protectedCookies['NAME'] = encodeURIComponent(data.name || data.acct.split('@')[0]);
                        protectedCookies['ACCT'] = encodeURIComponent(data.acct);
                        protectedCookies['UID'] = data.uid;

                        console.log('[Cookie Protector] Protected cookies:', Object.keys(protectedCookies));
                    }, 50);
                }
            }
        } catch (e) {
            // Ignore
        }

        return response;
    };

    console.log('[Cookie Protector] ✅ Active - NAME/ACCT/UID cookies are protected');
})();
