window.SessionManager = {
    init: function () {
        console.log('[Session] Initializing Manager...');
        this.setupGlobalLogoutDelegation();
        this.checkLoginStatus();
    },

    checkLoginStatus: function () {
        // Just log status, main.js handles the UI view
        const token = localStorage.getItem('authToken');
        if (token) console.log('[Session] User session active.');
    },

    // GLOBAL DELEGATION: Fixes the issue where the button is created later
    setupGlobalLogoutDelegation: function () {
        document.body.addEventListener('click', (e) => {
            // Traverse up from the clicked target to find a potential button
            const target = e.target.closest('a, button, div, span') || e.target;
            const text = (target.innerText || "").trim().toUpperCase();
            const className = (target.className || "").toString();
            const title = (target.getAttribute('title') || "").toUpperCase();

            // Check if this looks like a logout button
            const isLogout =
                text.includes("LOGOUT") ||
                text.includes("SIGN OUT") ||
                title.includes("LOGOUT") ||
                className.includes('setting-logout') ||
                className.includes('logout-btn');

            if (isLogout) {
                console.log('[Session] Logout Triggered via Delegation');
                e.preventDefault();
                e.stopPropagation();

                if (confirm('Are you sure you want to log out?')) {
                    this.logout();
                }
            }
        }, true); // Capture phase
    },

    logout: function () {
        console.log('[Session] Performing Nuclear Logout...');

        // 1. Clear Storage
        localStorage.clear();
        sessionStorage.clear();

        // 2. Clear Cookies (Iterate and expire)
        document.cookie.split(";").forEach(function (c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // 3. Reload
        window.location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.SessionManager.init();
});
