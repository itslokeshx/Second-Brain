(function () {
    'use strict';

    console.log('[Rate Us Patch] Installing GitHub redirect...');

    // Your GitHub repo URL
    const GITHUB_REPO = 'https://github.com/itslokeshx/Second-Brain/';

    // Store original window.open
    const originalWindowOpen = window.open;

    // Intercept window.open calls
    window.open = function (url, target, features) {
        if (url && (
            url.includes('chrome.google.com/webstore') ||
            url.includes('focustodo') ||
            url.includes('chrome://')
        )) {
            console.log('[Rate Us Patch] ✅ Intercepted window.open to Chrome Web Store');
            console.log('[Rate Us Patch] Original URL:', url);
            console.log('[Rate Us Patch] Redirecting to:', GITHUB_REPO);
            return originalWindowOpen.call(window, GITHUB_REPO, target || '_blank', features);
        }
        return originalWindowOpen.call(window, url, target, features);
    };

    // Intercept all clicks on the document
    document.addEventListener('click', function (e) {
        const target = e.target;

        // Check if this is a link
        if (target.tagName === 'A' || target.closest('a')) {
            const link = target.tagName === 'A' ? target : target.closest('a');
            const href = link.href || '';

            // Check if it's a Chrome Web Store link (Focus To-Do extension)
            if (href.includes('chrome.google.com/webstore') ||
                href.includes('focustodo') ||
                href.includes('chrome://')) {

                console.log('[Rate Us Patch] ✅ Intercepted Chrome Web Store link');
                console.log('[Rate Us Patch] Redirecting to:', GITHUB_REPO);

                // Prevent default action
                e.preventDefault();
                e.stopPropagation();

                // Open GitHub repo in new tab
                window.open(GITHUB_REPO, '_blank');

                return false;
            }
        }

        // Check for button clicks with text "Rate Us"
        const text = target.textContent || target.innerText || '';
        if (text.toLowerCase().includes('rate') &&
            (text.toLowerCase().includes('us') || text.toLowerCase().includes('app'))) {

            console.log('[Rate Us Patch] ✅ Intercepted "Rate Us" button');
            console.log('[Rate Us Patch] Redirecting to:', GITHUB_REPO);

            // Prevent default
            e.preventDefault();
            e.stopPropagation();

            // Open GitHub repo
            window.open(GITHUB_REPO, '_blank');

            return false;
        }

        // Check for ConfirmDialog confirm button
        if (target.classList && (
            target.classList.contains('ConfirmDialog-confirm-1p8lf') ||
            target.closest('.ConfirmDialog-confirm-1p8lf')
        )) {
            const dialog = target.closest('.ConfirmDialog-root-3ix4P');
            if (dialog) {
                const titleEl = dialog.querySelector('.ConfirmDialog-title-7dov_');
                if (titleEl && titleEl.textContent.toLowerCase().includes('love using')) {
                    console.log('[Rate Us Patch] ✅ Intercepted ConfirmDialog "Rate Us" button');
                    console.log('[Rate Us Patch] Redirecting to:', GITHUB_REPO);

                    e.preventDefault();
                    e.stopPropagation();

                    // Close the dialog
                    if (dialog.parentNode) {
                        dialog.parentNode.removeChild(dialog);
                    }

                    // Open GitHub repo
                    window.open(GITHUB_REPO, '_blank');

                    return false;
                }
            }
        }
    }, true); // Use capture phase to intercept early

    console.log('[Rate Us Patch] ✅ GitHub redirect installed');

})();
