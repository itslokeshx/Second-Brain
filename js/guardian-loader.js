

(function () {
    'use strict';


    // Create a blocking promise
    window.__GUARDIAN_READY__ = new Promise(async (resolve) => {
        // Wait for Guardian to be defined
        const waitForGuardian = setInterval(() => {
            if (window.IndexedDBGuardian) {
                clearInterval(waitForGuardian);

                let timeoutId = null;
                let resolved = false;

                // Wait for Guardian initialization
                const checkInit = setInterval(async () => {
                    if (window.IndexedDBGuardian.isInitialized && !resolved) {
                        resolved = true;
                        clearInterval(checkInit);
                        if (timeoutId) clearTimeout(timeoutId); // Cancel timeout
                        resolve(true);
                    }
                }, 50);

                // Timeout after 10 seconds
                timeoutId = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        clearInterval(checkInit);
                        console.warn('[Guardian Loader] ⚠️ Timeout - proceeding anyway');
                        resolve(false);
                    }
                }, 10000);
            }
        }, 10);
    });

    // Intercept main.js execution
    const originalDefine = window.define;
    let mainJsBlocked = false;

    window.define = function (...args) {
        // Check if this is main.js webpack bundle
        if (!mainJsBlocked && args.length > 0) {
            mainJsBlocked = true;

            window.__GUARDIAN_READY__.then(() => {

                if (originalDefine) {
                    originalDefine.apply(this, args);
                }
            });
        } else {
            if (originalDefine) {
                return originalDefine.apply(this, args);
            }
        }
    };

    // Preserve AMD properties
    if (originalDefine) {
        window.define.amd = originalDefine.amd;
    }

})();
