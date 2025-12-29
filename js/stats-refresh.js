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
        console.log('[Stats Refresh] Hydration complete - triggering UI refresh...');

        // Wait a bit for React to finish rendering
        setTimeout(() => {
            // Trigger a project change to force statistics recalculation
            const currentProject = document.querySelector('.ProjectItem-root-1iGkr.ProjectItem-checked-385Hh');

            if (currentProject) {
                console.log('[Stats Refresh] Clicking current project to force refresh...');
                currentProject.click();

                // Small delay then click again to ensure it refreshes
                setTimeout(() => {
                    currentProject.click();
                    console.log('[Stats Refresh] ✅ Statistics should now be updated');
                }, 100);
            }
        }, 500);
    });

    console.log('[Stats Refresh] ✅ Refresh trigger installed');
})();
