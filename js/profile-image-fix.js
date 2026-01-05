/**
 * Profile Image Fix
 * ═══════════════════════════════════════════════════════════════════════════
 * Fixes broken profile image (src="undefined") after login
 * 
 * Root Cause: main.js checks if portrait === "" but gets undefined instead
 * Solution: Intercept image src setter and replace undefined with default avatar
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';


    // Default avatar image
    const DEFAULT_AVATAR = 'assets/img/header-portrait.png';

    function fixProfileImages() {
        // Fix all existing broken images
        document.querySelectorAll('img.HomeHeader-portrait-xqqY2').forEach(img => {
            if (!img.src || img.src.includes('undefined') || img.src === window.location.href) {
                img.src = DEFAULT_AVATAR;
            }
        });

        // Intercept future image src changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                    const img = mutation.target;
                    if (img.classList.contains('HomeHeader-portrait-xqqY2')) {
                        if (!img.src || img.src.includes('undefined') || img.src === window.location.href) {
                            img.src = DEFAULT_AVATAR;
                        }
                    }
                }
            });
        });

        // Observe all images with the portrait class
        document.querySelectorAll('img.HomeHeader-portrait-xqqY2').forEach(img => {
            observer.observe(img, {
                attributes: true,
                attributeFilter: ['src']
            });
        });

        // Also watch for new portrait images being added
        const bodyObserver = new MutationObserver(() => {
            document.querySelectorAll('img.HomeHeader-portrait-xqqY2').forEach(img => {
                if (!img.src || img.src.includes('undefined') || img.src === window.location.href) {
                    img.src = DEFAULT_AVATAR;
                }
                // Observe this new image too
                observer.observe(img, {
                    attributes: true,
                    attributeFilter: ['src']
                });
            });
        });

        bodyObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

    }

    // Run immediately and on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixProfileImages);
    } else {
        fixProfileImages();
    }

    // Also run after a short delay to catch late-loading images
    setTimeout(fixProfileImages, 1000);


})();
