/**
 * Sync Button Handler
 * Explicitly connects the sync button to the MongoDB sync service
 * Removes any premium feature gates
 */

(function () {
    console.log('[Sync Button Handler] Loading...');

    function initSyncButton() {
        console.log('[Sync Button Handler] Initializing...');

        // Try multiple selectors to find the sync button
        const selectors = [
            '[data-sync]',
            '.sync-button',
            '#sync-btn',
            'button[title*="sync" i]',
            'button[title*="Sync" i]',
            '[onclick*="sync"]',
            '.header-sync',
            '.icon-sync'
        ];

        let syncBtn = null;
        for (const selector of selectors) {
            syncBtn = document.querySelector(selector);
            if (syncBtn) {
                console.log(`[Sync Button Handler] Found sync button using selector: ${selector}`);
                break;
            }
        }

        if (syncBtn) {
            // Remove existing onclick handlers
            const clonedBtn = syncBtn.cloneNode(true);
            syncBtn.parentNode.replaceChild(clonedBtn, syncBtn);
            syncBtn = clonedBtn;

            // Attach new handler
            syncBtn.addEventListener('click', handleSyncClick);
            console.log('[Sync Button Handler] ✅ Handler attached successfully');
        } else {
            console.warn('[Sync Button Handler] ⚠️ Could not find sync button with known selectors');
            console.warn('[Sync Button Handler] Falling back to global click listener');

            // Global fallback - listen for any click on elements containing "sync"
            document.addEventListener('click', (e) => {
                const target = e.target;
                const text = (target.innerText || '').toLowerCase();
                const title = (target.getAttribute('title') || '').toLowerCase();
                const className = (target.className || '').toString().toLowerCase();

                if (text.includes('sync') || title.includes('sync') || className.includes('sync')) {
                    console.log('[Sync Button Handler] Potential sync button clicked:', target);
                    handleSyncClick(e);
                }
            }, true);
        }
    }

    async function handleSyncClick(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('[Sync Button] 🔄 Clicked! Starting manual sync...');

        if (!window.syncService) {
            console.error('[Sync Button] ❌ Sync service not loaded');
            alert('Sync service not available. Please refresh the page.');
            return;
        }

        if (!window.syncService.isAuthenticated()) {
            console.warn('[Sync Button] ⚠️ Not authenticated');
            alert('Please login first to sync data.');
            return;
        }

        try {
            // Show loading indicator if possible
            const btn = e.currentTarget || e.target;
            const originalText = btn.innerText;
            if (btn.innerText) {
                btn.innerText = 'Syncing...';
                btn.disabled = true;
            }

            await window.syncService.syncAll();

            console.log('[Sync Button] ✅ Sync completed successfully');
            alert('✅ Sync completed successfully!');

            // Restore button
            if (btn.innerText) {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            console.error('[Sync Button] ❌ Sync failed:', error);
            alert('❌ Sync failed: ' + error.message);

            // Restore button
            const btn = e.currentTarget || e.target;
            if (btn.innerText) {
                btn.disabled = false;
            }
        }
    }

    // Keyboard shortcut: Ctrl+Shift+S (or Cmd+Shift+S on Mac)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            console.log('[Sync Button] ⌨️ Keyboard shortcut triggered (Ctrl+Shift+S)');

            if (window.syncService && window.syncService.isAuthenticated()) {
                window.syncService.syncAll().then(() => {
                    console.log('[Sync Button] ✅ Keyboard sync completed');
                }).catch((err) => {
                    console.error('[Sync Button] ❌ Keyboard sync failed:', err);
                });
            }
        }
    });

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSyncButton);
    } else {
        initSyncButton();
    }

    // Also try after a short delay in case DOM is still building
    setTimeout(initSyncButton, 1000);
    setTimeout(initSyncButton, 3000);

    console.log('[Sync Button Handler] ✅ Loaded (awaiting DOM ready)');
})();
