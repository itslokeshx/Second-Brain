// Blank Page Preventer - Catches errors that cause blank pages
(function () {
    'use strict';

    console.log('[Blank Page Preventer] Initializing...');

    // Catch all unhandled errors
    window.addEventListener('error', function (event) {
        console.error('[Blank Page Preventer] Caught error:', event.error);

        // Show notification
        if (window.showNotification) {
            window.showNotification(
                'An error occurred. Please refresh the page.',
                'error',
                10000
            );
        }

        // Prevent default error handling that might blank the page
        event.preventDefault();
        return true;
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', function (event) {
        console.error('[Blank Page Preventer] Unhandled promise rejection:', event.reason);

        if (window.showNotification) {
            window.showNotification(
                'A background error occurred. The app should still work.',
                'warning',
                5000
            );
        }

        event.preventDefault();
    });

    // Monitor for blank body (check every 3 seconds to give main.js time to render)
    const checkInterval = setInterval(() => {
        // Filter out scripts and other non-visual elements
        const visibleChildren = Array.from(document.body.children).filter(el => {
            const tagName = el.tagName.toUpperCase();
            return tagName !== 'SCRIPT' && tagName !== 'STYLE' && tagName !== 'LINK';
        });

        if (visibleChildren.length === 0) {
            console.error('[Blank Page Preventer] ❌ BLANK PAGE DETECTED!');
            clearInterval(checkInterval);

            // Try to show something
            document.body.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    font-family: Arial, sans-serif;
                    background: #f5f5f5;
                    padding: 20px;
                ">
                    <h1 style="color: #f44336; margin-bottom: 20px;">⚠️ Page Load Error</h1>
                    <p style="color: #666; margin-bottom: 30px; text-align: center; max-width: 500px;">
                        The application failed to load properly. This might be due to a JavaScript error.
                    </p>
                    <button onclick="location.reload()" style="
                        background: #2196F3;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 4px;
                        font-size: 16px;
                        cursor: pointer;
                    ">Reload Page</button>
                    <p style="color: #999; margin-top: 20px; font-size: 12px;">
                        Check the browser console (F12) for error details
                    </p>
                </div>
            `;
        }
    }, 3000); // Check every 3 seconds instead of 1

    // Stop checking after 15 seconds (increased from 10)
    setTimeout(() => clearInterval(checkInterval), 15000);

    console.log('[Blank Page Preventer] ✅ Active - Monitoring for errors');
})();
