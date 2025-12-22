/**
 * Sync Button Handler
 * Explicitly connects the sync button to the MongoDB sync service
 * Removes any premium feature gates
 */

(function () {
    console.log('[Sync Button Handler] Loading...');

    function initSyncButton() {
        console.log('[Sync Button Handler] Initializing...');

        // Extended selectors for legacy Focus To-Do sync button
        const selectors = [
            '[data-sync]',
            '.sync-button',
            '#sync-btn',
            'button[title*="sync" i]',
            'button[title*="Sync" i]',
            '.header-sync',
            '.icon-sync',
            '.sync', // Common legacy class
            '.top-bar-right-sync',
            '[class*="sync-icon"]'
        ];

        const findAndAttach = () => {
            let syncBtn = null;
            for (const selector of selectors) {
                syncBtn = document.querySelector(selector);
                if (syncBtn) {
                    console.log(`[Sync Button Handler] Found sync button using selector: ${selector}`);
                    break;
                }
            }

            if (syncBtn && !syncBtn.dataset.wired) {
                // Remove existing onclick handlers
                const clonedBtn = syncBtn.cloneNode(true);
                syncBtn.parentNode.replaceChild(clonedBtn, syncBtn);
                syncBtn = clonedBtn;

                // Attach new handler
                syncBtn.addEventListener('click', handleSyncClick);
                syncBtn.dataset.wired = "true"; // Mark as processed
                console.log('[Sync Button Handler] ✅ Handler attached successfully');
                return true;
            }
            return false;
        };

        // Attempt immediately
        if (findAndAttach()) return;

        // Use MutationObserver for dynamic rendering
        const observer = new MutationObserver((mutations) => {
            if (findAndAttach()) {
                observer.disconnect();
            }
        });

        const root = document.getElementById('root') || document.body;
        observer.observe(root, { childList: true, subtree: true });

        // Fallback global listener (keep as failsafe)
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, div, span, a') || e.target;
            const text = (target.innerText || '').toLowerCase();
            const title = (target.getAttribute('title') || '').toLowerCase();
            const className = (target.className || '').toString().toLowerCase();

            // Check if we already handled this in the attached handler
            if (target.dataset && target.dataset.wired) return;

            if (text.includes('sync') || title.includes('sync') || className.includes('sync')) {
                console.log('[Sync Button Handler] Global fallback caught sync click:', target);
                handleSyncClick(e);
            }
        }, true);
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
