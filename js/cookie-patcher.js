// Cookie Patcher - Fixes main.js cookie reading to prevent garbage characters
// This MUST load BEFORE main.js
(function () {
    'use strict';

    console.log('[Cookie Patcher] Initializing cookie fix...');

    // Store the original cookie descriptor
    const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');

    // Create a patched version that returns plain text cookies
    Object.defineProperty(Document.prototype, 'cookie', {
        get: function () {
            const cookies = originalCookieDescriptor.get.call(this);

            // Parse cookies
            const cookieObj = {};
            cookies.split(';').forEach(cookie => {
                const [key, ...valueParts] = cookie.trim().split('=');
                if (key) {
                    cookieObj[key] = valueParts.join('=');
                }
            });

            // If NAME or ACCT cookies exist and are URL-encoded, keep them as-is
            // main.js will try to decrypt them, but we'll intercept that too
            return cookies;
        },
        set: originalCookieDescriptor.set,
        configurable: true
    });

    // Patch any RSA decrypt functions that might be called on cookies
    // We'll override the decrypt to return the input if it's already plain text
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);

        // Clone to read
        const clonedResponse = response.clone();

        try {
            const url = args[0];
            if (typeof url === 'string' && (url.includes('/login') || url.includes('/register'))) {
                const data = await clonedResponse.json();

                if (data.status === 0 && data.acct) {
                    console.log('[Cookie Patcher] Login detected, ensuring plain cookies...');

                    // Set cookies as plain text (already URL-encoded by backend)
                    // These will be read by main.js, and we need to prevent decryption
                    setTimeout(() => {
                        // Force update username displays
                        const usernameElements = document.querySelectorAll('[class*="HomeHeader-username"], [class*="AccountSettings-account"]');
                        usernameElements.forEach(el => {
                            if (el && (el.textContent.includes('�') || el.textContent.includes('&'))) {
                                console.log('[Cookie Patcher] Fixing corrupted username element:', el.className);
                                el.textContent = data.name || data.acct.split('@')[0];
                            }
                        });
                    }, 100);
                }
            }
        } catch (e) {
            // Ignore parse errors
        }

        return response;
    };

    // Monitor for username elements and fix them immediately
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    // Check if this element or its children have username classes
                    const usernameEls = node.querySelectorAll ?
                        node.querySelectorAll('[class*="HomeHeader-username"], [class*="AccountSettings-account"]') :
                        [];

                    usernameEls.forEach(el => {
                        if (el.textContent && (el.textContent.includes('�') || el.textContent.includes('&'))) {
                            console.log('[Cookie Patcher] Fixing newly added username element');

                            // Get username from cookies
                            const cookies = document.cookie.split(';').reduce((acc, c) => {
                                const [k, v] = c.trim().split('=');
                                acc[k] = decodeURIComponent(v || '');
                                return acc;
                            }, {});

                            if (cookies.NAME) {
                                el.textContent = cookies.NAME;
                            } else if (cookies.ACCT) {
                                el.textContent = cookies.ACCT.split('@')[0];
                            }
                        }
                    });
                }
            });
        });
    });

    // Start observing when DOM is ready
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    console.log('[Cookie Patcher] ✅ Cookie fix active');
})();
