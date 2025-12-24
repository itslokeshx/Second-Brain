// Cookie Injector - DISABLED for security
// This was bypassing authentication by setting cookies regardless of backend response
(function () {
    'use strict';

    console.log('[Cookie Injector] DISABLED - Security priority');
    console.log('[Cookie Injector] Cookies will ONLY be set by backend on successful auth');

    // Completely disabled - no more automatic cookie injection
    // The backend will set cookies on successful login
    // The cookie-protector will block any invalid attempts
})();
