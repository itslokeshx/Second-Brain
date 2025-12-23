// Main.js Patcher - Patches RSA decrypt to handle plain text cookies
// This MUST load BEFORE main.js
(function () {
    'use strict';

    console.log('[Main Patcher] Initializing...');

    // Wait for main.js to load and define its RSA/decrypt functions
    const patchInterval = setInterval(() => {
        // Look for JSEncrypt or any decrypt function in window
        if (window.JSEncrypt || window.le || window.decrypt) {
            console.log('[Main Patcher] Found encryption library, patching...');

            // Patch JSEncrypt if it exists
            if (window.JSEncrypt && window.JSEncrypt.prototype) {
                const originalDecrypt = window.JSEncrypt.prototype.decrypt;
                window.JSEncrypt.prototype.decrypt = function (str) {
                    // If string is already plain text (contains @ or is short), return as-is
                    if (!str || str.includes('@') || str.length < 50) {
                        console.log('[Main Patcher] Skipping decrypt for plain text:', str?.substring(0, 30));
                        return str;
                    }
                    return originalDecrypt.call(this, str);
                };
                console.log('[Main Patcher] ✅ Patched JSEncrypt.decrypt');
            }

            // Patch any global decrypt function
            if (typeof window.decrypt === 'function') {
                const originalDecrypt = window.decrypt;
                window.decrypt = function (str) {
                    if (!str || str.includes('@') || str.length < 50) {
                        console.log('[Main Patcher] Skipping global decrypt for plain text:', str?.substring(0, 30));
                        return str;
                    }
                    return originalDecrypt(str);
                };
                console.log('[Main Patcher] ✅ Patched global decrypt');
            }

            clearInterval(patchInterval);
        }
    }, 100);

    // Stop trying after 5 seconds
    setTimeout(() => {
        clearInterval(patchInterval);
        console.log('[Main Patcher] Timeout - encryption library may not exist');
    }, 5000);

    // Also patch document.cookie getter to log what's being read
    const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    let cookieReadCount = 0;

    Object.defineProperty(Document.prototype, 'cookie', {
        get: function () {
            const cookies = originalCookieDescriptor.get.call(this);
            cookieReadCount++;
            if (cookieReadCount <= 5) { // Only log first 5 reads
                console.log('[Main Patcher] Cookie read #' + cookieReadCount + ':', cookies);
            }
            return cookies;
        },
        set: originalCookieDescriptor.set,
        configurable: true
    });

    console.log('[Main Patcher] ✅ Ready');
})();
