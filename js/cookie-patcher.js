(function () {
    'use strict';



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

                // ═══════════════════════════════════════════════════════════════════════
                // 🛡️ NUCLEAR OPTION: Block NAME cookie from React
                // React (main.js) reads NAME cookie and injects it into task inputs
                // This causes "hope369" to appear in task fields
                // Solution: Completely hide NAME cookie from document.cookie reads
                // ═══════════════════════════════════════════════════════════════════════
                if (key === 'NAME') {
                    // Silently filter out - don't log to avoid spam
                    return false;
                }

                // Remove auth cookies with undefined/null/empty values
                if (key === 'ACCT' || key === 'UID' || key === 'PID' || key === 'JSESSIONID') {
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



})();
