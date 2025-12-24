// Cookie Patcher - Prevents main.js from reading invalid cookies
// This MUST load BEFORE main.js
(function () {
    'use strict';

    console.log('[Cookie Patcher] Initializing STRICT cookie validation...');

    // Get the original cookie descriptor
    const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
        Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');

    if (!originalDescriptor) {
        console.error('[Cookie Patcher] Cannot find cookie descriptor!');
        return;
    }

    // Override cookie getter to REMOVE invalid cookies
    Object.defineProperty(Document.prototype, 'cookie', {
        get: function () {
            let cookies = originalDescriptor.get.call(this);

            // Filter out cookies with invalid values
            const cookiePairs = cookies.split(';').map(c => c.trim());
            const validCookies = cookiePairs.filter(pair => {
                const [key, value] = pair.split('=');

                // Remove auth cookies with undefined/null/empty values
                if (key === 'ACCT' || key === 'NAME' || key === 'UID' || key === 'PID' || key === 'JSESSIONID') {
                    if (!value || value === 'undefined' || value === 'null' || value.trim() === '') {
                        if (!window._lastCookieLog || Date.now() - window._lastCookieLog > 5000) {
                            console.warn(`[Cookie Patcher] ❌ Filtering out invalid cookies (e.g. ${key}=undefined). Suppressing logs for 5s.`);
                            window._lastCookieLog = Date.now();
                        }
                        return false;
                    }
                }
                return true;
            });

            return validCookies.join('; ');
        },
        set: originalDescriptor.set,
        configurable: true
    });

    console.log('[Cookie Patcher] ✅ Active - Invalid cookies will be filtered from reads');
})();
