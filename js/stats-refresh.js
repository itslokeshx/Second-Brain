// ═══════════════════════════════════════════════════════════════════
// 🔄 FORCE UI STATISTICS REFRESH
// ═══════════════════════════════════════════════════════════════════
// Forces React to recalculate statistics after data is loaded
// This fixes the 0m/NaN display issue after sync
// ═══════════════════════════════════════════════════════════════════

(function () {
    console.log('[Stats Refresh] Installing post-hydration refresh trigger...');

    // Listen for hydration complete event
    window.addEventListener('hydration-complete', () => {
        console.log('[Stats Refresh] Hydration complete - checking if reload needed...');

        // Check if this is the first load after sync
        const needsReload = localStorage.getItem('_pendingUIRefresh');

        if (needsReload === 'true') {
            console.log('[Stats Refresh] 🔄 Reloading page to refresh UI statistics...');
            localStorage.removeItem('_pendingUIRefresh');

            // Small delay to ensure data is saved
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            console.log('[Stats Refresh] ✅ No reload needed');
        }
    });

    // Listen for sync complete event (from sync-button-handler.js)
    window.addEventListener('sync-complete', () => {
        console.log('[Stats Refresh] Sync complete - marking for UI refresh...');
        localStorage.setItem('_pendingUIRefresh', 'true');
    });

    console.log('[Stats Refresh] ✅ Refresh trigger installed');
})();

