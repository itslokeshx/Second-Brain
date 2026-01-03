// Blank Page Preventer - Catches errors that cause blank pages
(function () {
    'use strict';

    // console.log('[Blank Page Preventer] Initializing...');

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

    // ═══════════════════════════════════════════════════════════════════════
    // DISABLED AUTO-RELOAD - was causing login issues
    // The blank page issue needs a different fix
    // ═══════════════════════════════════════════════════════════════════════

    // console.log('[Blank Page Preventer] ✅ Active - Monitoring for errors');
})();
