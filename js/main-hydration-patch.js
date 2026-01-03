/**
 * Main.js Hydration Patch
 * ═══════════════════════════════════════════════════════════════════════════
 * Patches main.js to integrate with loading orchestrator
 * 
 * This script:
 * 1. Sets hydration phase to true when main.js starts
 * 2. Detects when React finishes rendering
 * 3. Dispatches SB_HYDRATION_DONE event to hide loader
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // console.log('[Main Patch] Installing hydration detection...');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE START: Set hydration phase when main.js loads
    // ═══════════════════════════════════════════════════════════════════════

    if (window.__SB_LOADER) {
        window.__SB_LOADER.setPhase('hydrate', true);
        // console.log('[Main Patch] ✅ Hydration phase started');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE END: Detect when React finishes rendering
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Detect React render completion
     * We check for:
     * 1. React root element has children
     * 2. IndexedDB has data
     * 3. localStorage has projects
     */
    function checkHydrationComplete() {
        const root = document.getElementById('root');

        // Check 1: React has rendered something
        if (!root || !root.firstChild) {
            return false;
        }

        // Check 2: localStorage has projects (main.js reads from here)
        const projects = localStorage.getItem('pomodoro-projects');
        if (!projects || projects === '[]') {
            return false;
        }

        // Check 3: UI is actually visible (not just login form)
        const hasMainUI = root.querySelector('[class*="Home"]') ||
            root.querySelector('[class*="Task"]') ||
            root.querySelector('[class*="Project"]');

        return Boolean(hasMainUI);
    }

    /**
     * Poll for hydration completion
     */
    function pollHydration() {
        if (checkHydrationComplete()) {
            // console.log('[Main Patch] ✅ Hydration complete - dispatching event');
            window.dispatchEvent(new Event('SB_HYDRATION_DONE'));
        } else {
            // Keep checking (max 10 seconds)
            if (pollHydration.attempts < 100) {
                pollHydration.attempts++;
                requestAnimationFrame(pollHydration);
            } else {
                console.warn('[Main Patch] ⚠️ Hydration timeout - forcing completion');
                window.dispatchEvent(new Event('SB_HYDRATION_DONE'));
            }
        }
    }
    pollHydration.attempts = 0;

    // ✅ FIX: Start polling IMMEDIATELY (no delay)
    // This ensures hydration phase overlaps with nav phase
    requestAnimationFrame(pollHydration);

    // console.log('[Main Patch] ✅ Hydration detection installed');

})();
