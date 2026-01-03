// Main.js Patcher - SECURITY ENHANCED
// This MUST load BEFORE main.js
(function () {
    'use strict';


    // Wait for main.js to load and define its RSA/decrypt functions
    const patchInterval = setInterval(() => {
        // Look for JSEncrypt or any decrypt function in window
        if (window.JSEncrypt || window.le || window.decrypt) {

            // Patch JSEncrypt if it exists
            if (window.JSEncrypt && window.JSEncrypt.prototype) {
                const originalDecrypt = window.JSEncrypt.prototype.decrypt;
                window.JSEncrypt.prototype.decrypt = function (str) {
                    // If string is already plain text (contains @ or is short), return as-is
                    if (!str || str.includes('@') || str.length < 50) {
                        return str;
                    }
                    return originalDecrypt.call(this, str);
                };
            }

            // Patch any global decrypt function
            if (typeof window.decrypt === 'function') {
                const originalDecrypt = window.decrypt;
                window.decrypt = function (str) {
                    if (!str || str.includes('@') || str.length < 50) {
                        return str;
                    }
                    return originalDecrypt(str);
                };
            }

            clearInterval(patchInterval);
        }
    }, 100);

    // Stop trying after 5 seconds
    setTimeout(() => {
        clearInterval(patchInterval);
        if (!window.JSEncrypt?.prototype?.decrypt) {
        }
    }, 5000);

    // DON'T override cookie descriptor - let cookie-protector handle it
})();
