/**
 * Asset Path Patcher - Fixes broken pomodoro image paths
 * Intercepts image src assignments and ensures correct paths to assets/img/
 */
(function () {
    'use strict';

    console.log('[Asset Patcher] Initializing...');

    // ═══════════════════════════════════════════════════════════════════════
    // CRITICAL FIX: Intercept HTMLImageElement.src setter
    // ═══════════════════════════════════════════════════════════════════════
    const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');

    if (originalSrcDescriptor && originalSrcDescriptor.set) {
        Object.defineProperty(HTMLImageElement.prototype, 'src', {
            get: originalSrcDescriptor.get,
            set: function (value) {
                // Fix broken/missing paths for pomodoro images
                if (value && typeof value === 'string') {
                    let fixedValue = value;

                    // Case 1: Empty or undefined path
                    if (!value || value === 'undefined' || value === '') {
                        console.warn('[Asset Patcher] Empty image src detected, using fallback');
                        fixedValue = 'assets/img/task-pomo-actual.png';
                    }
                    // Case 2: Path missing 'assets/' prefix
                    else if (value.startsWith('img/')) {
                        fixedValue = 'assets/' + value;
                        console.log(`[Asset Patcher] Fixed path: ${value} → ${fixedValue}`);
                    }
                    // Case 3: Double 'assets/assets/' prefix
                    else if (value.includes('assets/assets/')) {
                        fixedValue = value.replace('assets/assets/', 'assets/');
                        console.log(`[Asset Patcher] Fixed double prefix: ${value} → ${fixedValue}`);
                    }
                    // Case 4: Pomodoro images specifically
                    else if (value.includes('pomo') && !value.includes('assets/')) {
                        fixedValue = 'assets/img/' + value.split('/').pop();
                        console.log(`[Asset Patcher] Fixed pomodoro path: ${value} → ${fixedValue}`);
                    }

                    originalSrcDescriptor.set.call(this, fixedValue);
                } else {
                    originalSrcDescriptor.set.call(this, value);
                }
            },
            configurable: true,
            enumerable: true
        });

        console.log('[Asset Patcher] ✅ Image src interceptor installed');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FALLBACK: MutationObserver to fix existing broken images
    // ═══════════════════════════════════════════════════════════════════════
    function fixExistingImages() {
        const images = document.querySelectorAll('img');
        let fixedCount = 0;

        images.forEach(img => {
            const src = img.getAttribute('src');

            // Fix images with no src or broken src
            if (!src || src === '' || src === 'undefined') {
                // Check if it's a pomodoro image by checking parent classes
                const parent = img.closest('[class*="pomodoro"], [class*="pomo"], [class*="TaskItem"]');
                if (parent) {
                    img.src = 'assets/img/task-pomo-actual.png';
                    fixedCount++;
                }
            }
            // Fix paths missing 'assets/' prefix
            else if (src.startsWith('img/')) {
                img.src = 'assets/' + src;
                fixedCount++;
            }
            // Fix double prefix
            else if (src.includes('assets/assets/')) {
                img.src = src.replace('assets/assets/', 'assets/');
                fixedCount++;
            }
        });

        if (fixedCount > 0) {
            console.log(`[Asset Patcher] 🔧 Fixed ${fixedCount} existing broken images`);
        }
    }

    // Run immediately
    fixExistingImages();

    // Run after DOM changes
    const observer = new MutationObserver(() => {
        fixExistingImages();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Run periodically for dynamic content
    setInterval(fixExistingImages, 2000);

    console.log('[Asset Patcher] ✅ Active - monitoring for broken images');
})();
