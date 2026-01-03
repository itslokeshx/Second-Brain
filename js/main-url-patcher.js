/**
 * Main.js URL Patcher
 * Patches hardcoded localhost:3000 URLs in main.js before it executes
 * This is a CRITICAL fix for production deployment
 */

(function () {
    'use strict';

    console.log('[Main Patcher] Intercepting main.js load...');

    // Production backend URL
    const BACKEND_URL = 'https://second-brain-backend-saxs.onrender.com';

    // Store original createElement
    const originalCreateElement = document.createElement;

    // Override createElement to intercept script tags
    document.createElement = function (tagName) {
        const element = originalCreateElement.call(document, tagName);

        if (tagName.toLowerCase() === 'script') {
            // Store original src setter
            const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');

            // Override src setter for this specific script element
            Object.defineProperty(element, 'src', {
                get: function () {
                    return originalSrcDescriptor.get.call(this);
                },
                set: function (value) {
                    // Check if this is main.js
                    if (value && value.includes('main.js')) {
                        console.log('[Main Patcher] Detected main.js load, will patch content...');

                        // Fetch main.js, patch it, and inject
                        fetch(value)
                            .then(response => response.text())
                            .then(code => {
                                // Replace all localhost:3000 with Render backend
                                const patchedCode = code
                                    .replace(/http:\/\/localhost:3000/g, BACKEND_URL)
                                    .replace(/https:\/\/localhost:3000/g, BACKEND_URL)
                                    .replace(/"localhost:3000"/g, `"${BACKEND_URL.replace('https://', '')}"`)
                                    .replace(/'localhost:3000'/g, `'${BACKEND_URL.replace('https://', '')}'`);

                                console.log('[Main Patcher] ✅ Patched main.js with production URLs');

                                // Create a blob URL with patched code
                                const blob = new Blob([patchedCode], { type: 'application/javascript' });
                                const blobUrl = URL.createObjectURL(blob);

                                // Set the blob URL as src
                                originalSrcDescriptor.set.call(this, blobUrl);
                            })
                            .catch(error => {
                                console.error('[Main Patcher] ❌ Failed to patch main.js:', error);
                                // Fallback to original URL
                                originalSrcDescriptor.set.call(this, value);
                            });

                        return;
                    }

                    // For non-main.js scripts, use original setter
                    originalSrcDescriptor.set.call(this, value);
                },
                configurable: true
            });
        }

        return element;
    };

})();
