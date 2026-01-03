// Cookie Protector - STRICT MODE - Prevents login bypass
// This MUST load BEFORE main.js
(function () {
    'use strict';


    let loginInProgress = false;
    let loginSuccessful = false;

    // Get the original cookie descriptor
    const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
        Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');

    if (!originalDescriptor) {
        console.error('[Cookie Protector] Cannot find cookie descriptor!');
        return;
    }

    // Override the cookie setter to BLOCK auth cookies unless login succeeded
    Object.defineProperty(Document.prototype, 'cookie', {
        get: function () {
            return originalDescriptor.get.call(this);
        },
        set: function (value) {
            // ✅ BYPASS: Allow cookie clearing (logout)
            // If setting cookie with expired date, allow it through
            if (value.includes('expires=Thu, 01 Jan 1970')) {
                return originalDescriptor.set.call(this, value);
            }

            // Parse the cookie being set
            const [cookiePair] = value.split(';');
            const [key, val] = cookiePair.split('=');

            // STRICT: Block NAME, ACCT, UID cookies unless login was successful
            // NOTE: PID is allowed to be set anytime (it's not sensitive, just a project ID)
            if (key === 'NAME' || key === 'ACCT' || key === 'UID') {
                // Block if login is in progress but not successful
                if (loginInProgress && !loginSuccessful) {
                    console.warn(`[Cookie Protector] ❌ BLOCKED ${key} - Login not successful yet`);
                    return;
                }

                // Block undefined, null, or empty values
                if (!val || val === 'undefined' || val === 'null' || val.trim() === '') {
                    console.warn(`[Cookie Protector] ❌ BLOCKED ${key}=${val} - Invalid value`);
                    return;
                }

            }

            // PID cookie is allowed (not sensitive, just project ID)
            if (key === 'PID') {
                // Block undefined/null/empty PID values
                if (!val || val === 'undefined' || val === 'null' || val.trim() === '') {
                    console.warn(`[Cookie Protector] ❌ BLOCKED PID=${val} - Invalid value`);
                    return;
                }
                // Allow valid PID values like "0"
            }

            // Allow the cookie to be set
            originalDescriptor.set.call(this, value);
        },
        configurable: true
    });

    // Monitor fetch for login attempts
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const url = args[0];

        // Detect login/register requests
        if (typeof url === 'string' && (url.includes('/login') || url.includes('/register'))) {
            loginInProgress = true;
            loginSuccessful = false;
        }

        const response = await originalFetch.apply(this, args);
        const clonedResponse = response.clone();

        try {
            if (typeof url === 'string' && (url.includes('/login') || url.includes('/register'))) {
                const data = await clonedResponse.json();

                // Check if login was successful
                if (data.status === 0 && data.success !== false && data.acct && data.uid) {
                    loginSuccessful = true;
                } else {
                    loginSuccessful = false;
                }

                // Reset after 10 seconds to give main.js time to initialize
                setTimeout(() => {
                    loginInProgress = false;
                }, 10000);
            }
        } catch (e) {
            console.error('[Cookie Protector] Error parsing response:', e);
            loginSuccessful = false;
        }

        return response;
    };

})();
