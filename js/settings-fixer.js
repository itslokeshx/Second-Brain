// Settings Page Fixer - Fixes username input field in settings
(function () {
    'use strict';


    // Monitor for settings page opening
    const observer = new MutationObserver(() => {
        // Look for username input field in settings
        const usernameInputs = document.querySelectorAll('input[type="text"]');

        usernameInputs.forEach(input => {
            // If input value contains garbage characters
            if (input.value && (input.value.includes('�') || input.value.includes('%G'))) {

                // Get username from cookies
                const cookies = document.cookie.split(';').reduce((acc, c) => {
                    const [k, v] = c.trim().split('=');
                    acc[k] = decodeURIComponent(v || '');
                    return acc;
                }, {});

                // Set to username from NAME cookie
                if (cookies.NAME) {
                    input.value = cookies.NAME;
                }
            }
        });
    });

    // Start observing
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['value']
        });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['value']
            });
        });
    }

    // Also fix on interval
    setInterval(() => {
        const usernameInputs = document.querySelectorAll('input[type="text"]');
        const cookies = document.cookie.split(';').reduce((acc, c) => {
            const [k, v] = c.trim().split('=');
            acc[k] = decodeURIComponent(v || '');
            return acc;
        }, {});

        // Fix corrupted input fields
        usernameInputs.forEach(input => {
            if (input.value && (input.value.includes('') || input.value.includes('%G')) && cookies.NAME) {
                input.value = cookies.NAME;
            }
        });

        // Fix buttons showing email addresses
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            // If button text is exactly an email address, change it to "Change"
            if (button.textContent && button.textContent.trim().includes('@') && button.textContent.trim().includes('.')) {
                button.textContent = 'Change';
            }
        });
    }, 500);

})();
