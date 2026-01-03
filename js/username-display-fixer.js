// Username Display Fixer - Direct DOM manipulation
// Finds the garbled username and replaces it with the correct value from ACCT cookie
(function () {
    'use strict';

    // console.log('[Username Fixer] Installing direct DOM fix...');

    // Function to get cookie value
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }

    // Function to fix username display
    function fixUsername() {
        // Find the username span element
        const usernameSpan = document.querySelector('.HomeHeader-username-2_ExH');

        if (!usernameSpan) {
            return; // Element not found yet
        }

        const currentText = usernameSpan.textContent;

        // Check if text is garbled (contains special characters or is empty)
        const isGarbled = !currentText ||
            currentText.includes('�') ||
            currentText.includes('undefined') ||
            currentText.trim() === '';

        if (isGarbled) {
            // Get username from ACCT cookie
            const acct = getCookie('ACCT');

            if (acct) {
                // Extract username from email (before @)
                const username = acct.split('@')[0];
                usernameSpan.textContent = username;
                // console.log('[Username Fixer] ✅ Fixed garbled username:', username);
                return true; // Fixed successfully
            }
        }

        return false; // No fix needed or couldn't fix
    }

    // Try to fix immediately
    if (fixUsername()) {
        // console.log('[Username Fixer] ✅ Username fixed on first try');
    } else {
        // Set up interval to keep checking and fixing
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds

        const fixInterval = setInterval(() => {
            attempts++;

            if (fixUsername()) {
                // console.log('[Username Fixer] ✅ Username fixed after', attempts, 'attempts');
                clearInterval(fixInterval);
            } else if (attempts >= maxAttempts) {
                console.warn('[Username Fixer] ⚠️ Could not find username element after 5s');
                clearInterval(fixInterval);
            }
        }, 100);
    }

    // Also set up MutationObserver to catch any dynamic changes
    const observer = new MutationObserver(() => {
        fixUsername();
    });

    // Start observing when body is available
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        // console.log('[Username Fixer] ✅ MutationObserver active');
    }

})();
