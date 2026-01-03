// ✅ CONSOLE ERROR SUPPRESSOR
// Suppresses known non-critical errors from legacy main.js

(function () {
    'use strict';

    console.log('[Error Suppressor] Initializing...');

    // Store original console.error
    const originalError = console.error;
    const originalWarn = console.warn;

    // List of errors to suppress (non-critical legacy issues)
    const suppressPatterns = [
        /WebSocket connection.*failed/i,
        /Cannot read properties of undefined.*reading 'length'/i,
        /Failed to load resource.*404/i,
        /net::ERR_FAILED/i
    ];

    // Override console.error
    console.error = function (...args) {
        const message = args.join(' ');

        // Check if this error should be suppressed
        const shouldSuppress = suppressPatterns.some(pattern => pattern.test(message));

        if (shouldSuppress) {
            // Silently log to a debug array instead
            if (!window._suppressedErrors) window._suppressedErrors = [];
            window._suppressedErrors.push({ time: new Date(), message });
            return; // Don't show in console
        }

        // Show other errors normally
        originalError.apply(console, args);
    };

    // Override console.warn for WebSocket warnings
    console.warn = function (...args) {
        const message = args.join(' ');

        if (message.includes('WebSocket')) {
            return; // Suppress WebSocket warnings
        }

        originalWarn.apply(console, args);
    };

    console.log('[Error Suppressor] ✅ Active - Suppressing known legacy errors');
    console.log('[Error Suppressor] View suppressed errors: window._suppressedErrors');
})();
