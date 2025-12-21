(function () {
    console.log('[Network] Initializing Interceptor for FocusTodo migration...');

    // cleanup corrupted data BEFORE main.js runs
    try {
        console.log('[Init] Checking for corrupted storage data...');

        const cleanStore = (store, name) => {
            Object.keys(store).forEach(key => {
                const val = store.getItem(key);
                // Check if value looks like a stringified object reference
                if (val && (val.includes('[object Object]') || val === 'undefined')) {
                    console.warn(`[Cleanup] Removing corrupted ${name} key: ${key}`);
                    store.removeItem(key);
                }
            });
        };

        cleanStore(localStorage, 'localStorage');
        cleanStore(sessionStorage, 'sessionStorage');

    } catch (e) {
        console.error('[Init] Failed to cleanup storage:', e);
    }

    const TARGET_HOST = 'http://localhost:3000';
    const BLOCKED_DOMAINS = ['focustodo.net', 'www.focustodo.net', 'api.focustodo.net'];

    // Helper: Show Notification
    function showNotification(message, type = 'success') {
        // Create notification element if not exists or replace
        const existing = document.querySelector('.network-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `network-notification notification-${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">${type === 'success' ? '✅' : '❌'}</span>
                <div>${message.replace(/\n/g, '<br>')}</div>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 100000; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
            max-width: 350px;
        `;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Intercept Fetch
    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
        let url = input;
        if (typeof input === 'string') {
            for (const domain of BLOCKED_DOMAINS) {
                if (url.includes(domain)) {
                    console.log(`[Network] Redirecting fetch ${url} to localhost`);
                    url = url.replace(/https?:\/\/[^\/]+/, TARGET_HOST);
                }
            }
        }
        return originalFetch(url, init);
    };

    // Store original methods
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    // Intercept open to redirect URLs
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
        this._interceptedUrl = url; // Store original URL for checking

        if (typeof url === 'string') {
            for (const domain of BLOCKED_DOMAINS) {
                if (url.includes(domain)) {
                    const newUrl = url.replace(/https?:\/\/[^\/]+/, TARGET_HOST);
                    console.log('[Network] Redirecting XHR', url, '→', newUrl);
                    return originalOpen.call(this, method, newUrl, ...args);
                }
            }
        }
        return originalOpen.call(this, method, url, ...args);
    };

    // Intercept send to catch success responses
    XMLHttpRequest.prototype.send = function (...args) {
        // Add load event listener to capture response
        this.addEventListener('load', function () {
            try {
                // Check if this was an auth request
                const url = this.responseURL || this._interceptedUrl;
                if (!url) return;

                const isLogin = url.includes('/login');
                const isRegister = url.includes('/register');

                if ((isLogin || isRegister) && this.status >= 200 && this.status < 300) {
                    console.log(`[Network] Intercepted successful Auth request: ${url}`);

                    let data;
                    try {
                        data = JSON.parse(this.responseText);
                    } catch (e) {
                        console.warn('[Network] Failed to parse auth response', e);
                        return;
                    }

                    if (data.success && data.token) {
                        console.log('[Network] Auth Success! Saving data and alerting user.');

                        // Reliability: Function to save data
                        const saveAuth = () => {
                            localStorage.setItem('authToken', data.token);
                            localStorage.setItem('userId', data.user.id);
                            localStorage.setItem('userEmail', data.user.email);
                            if (data.user.name) localStorage.setItem('username', data.user.name);
                        };
                        saveAuth();

                        // Show Alert
                        const action = isLogin ? 'Login' : 'Registration';
                        showNotification(`${action} Successful!\nWelcome back, ${data.user.name || 'User'}!`, 'success');

                        // Force reload to apply state if main.js doesn't do it
                        setTimeout(() => {
                            if (window.SessionManager) {
                                window.SessionManager.init();
                            } else {
                                // save again just in case main.js wiped it (race condition)
                                saveAuth();
                                window.location.reload();
                            }
                        }, 1500);
                    }
                } else if ((isLogin || isRegister) && this.status >= 400) {
                    // Error handling
                    let msg = 'Authentication failed.';
                    try {
                        const errData = JSON.parse(this.responseText);
                        msg = errData.message || msg;
                    } catch (e) { }
                    showNotification(`Error: ${msg}`, 'error');
                }

            } catch (e) {
                console.error('[Network] Error in auth interceptor:', e);
            }
        });

        return originalSend.apply(this, args);
    };

    console.log('[Network] Interceptor Active. All external traffic routed to localhost.');
})();
