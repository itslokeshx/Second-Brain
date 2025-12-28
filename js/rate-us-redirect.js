(function () {
    'use strict';

    console.log('[Rate Us Patch] Installing GitHub redirect...');

    // Your GitHub repo URL
    const GITHUB_REPO = 'https://github.com/itslokeshx/Second-Brain/';

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

        // Also check for button clicks with text "Rate Us"
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
    }, true); // Use capture phase to intercept early

    console.log('[Rate Us Patch] ✅ GitHub redirect installed');

})();
