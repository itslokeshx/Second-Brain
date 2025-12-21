document.addEventListener('DOMContentLoaded', () => {
    // Check if logged in
    const token = localStorage.getItem('authToken');
    const authBtn = document.getElementById('auth-btn');
    const authModal = document.getElementById('auth-modal');
    const closeBtn = document.querySelector('.close-modal');
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const usernameDisplay = document.getElementById('username-display');

    // UI State Helpers
    const showLoading = (btn, text) => {
        btn.dataset.originalText = btn.textContent;
        btn.textContent = text;
        btn.disabled = true;
    };

    const hideLoading = (btn) => {
        btn.textContent = btn.dataset.originalText || 'Submit';
        btn.disabled = false;
    };

    const showError = (elementId, message) => {
        const el = document.getElementById(elementId);
        el.textContent = message;
        el.style.color = 'red';
        el.style.display = 'block';
    };

    const clearError = (elementId) => {
        const el = document.getElementById(elementId);
        el.textContent = '';
        el.style.display = 'none';
        el.style.visibility = 'hidden'; // Ensure it's hidden
    };

    // Custom Notification System
    function showNotification(message, type = 'success') {
        // Remove existing notifications to prevent stacking
        const existing = document.querySelector('.auth-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `auth-notification notification-${type}`;
        notification.textContent = message;

        // Inline styles for simplicity and self-containment
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            z-index: 10001; 
            font-family: 'Inter', sans-serif;
            font-weight: 500;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    if (token) {
        updateUIState(true);
    } else {
        updateUIState(false);
    }

    // Toggle Modal
    authBtn.onclick = () => {
        if (localStorage.getItem('authToken')) {
            // Logout
            logout();
        } else {
            // Clear previous errors
            clearError('login-error');
            clearError('reg-error');
            // Show login by default
            loginForm.style.display = 'block';
            regForm.style.display = 'none';
            authModal.style.display = 'block';
        }
    };

    closeBtn.onclick = () => {
        authModal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == authModal) {
            authModal.style.display = 'none';
        }
    };

    // Toggle between Login/Register
    document.getElementById('show-register').innerHTML = '<a href="#" id="link-register">No account? Register</a>';
    document.getElementById('show-login').innerHTML = '<a href="#" id="link-login">Have an account? Login</a>';

    document.getElementById('link-register').onclick = (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        clearError('login-error');
        clearError('reg-error');
    };

    document.getElementById('link-login').onclick = (e) => {
        e.preventDefault();
        regForm.style.display = 'none';
        loginForm.style.display = 'block';
        clearError('login-error');
        clearError('reg-error');
    };

    // Handle Login
    document.getElementById('btn-login').textContent = 'Sign In';
    document.getElementById('btn-login').onclick = async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('btn-login');

        if (!email || !password) {
            showError('login-error', 'Please fill in all fields');
            return;
        }

        showLoading(btn, 'Signing In...');
        clearError('login-error');

        try {
            // Ensure API URL is available, default if not
            const apiUrl = (window.syncService && window.syncService.apiUrl) ? window.syncService.apiUrl : 'http://localhost:3000';

            const response = await fetch(`${apiUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            // ✅ Fix: Parse response once
            const data = await response.json();
            console.log('Login response:', data);

            if (data.success) {
                handleAuthSuccess(data);
                showNotification(`Welcome back, ${data.user.name || 'User'}!`, 'success');
            } else {
                showError('login-error', data.message || 'Login failed');
                showNotification(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            const msg = 'Network Error. Check console.';
            showError('login-error', msg);
            showNotification(msg, 'error');
        } finally {
            hideLoading(btn);
        }
    };

    // Handle Register
    document.getElementById('btn-register').textContent = 'Sign Up';
    document.getElementById('btn-register').onclick = async () => {
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const btn = document.getElementById('btn-register');

        if (!username || !email || !password) {
            showError('reg-error', 'Please fill in all fields');
            return;
        }

        showLoading(btn, 'Signing Up...');
        clearError('reg-error');

        try {
            const apiUrl = (window.syncService && window.syncService.apiUrl) ? window.syncService.apiUrl : 'http://localhost:3000';

            const response = await fetch(`${apiUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: username, email, password })
            });

            // ✅ Fix: Parse response once
            const data = await response.json();
            console.log('Register response:', data);

            if (data.success) {
                handleAuthSuccess(data);
                showNotification('Registration successful! Welcome!', 'success');
            } else {
                showError('reg-error', data.message || 'Registration failed');
                showNotification(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            const msg = 'Network Error. Check console.';
            showError('reg-error', msg);
            showNotification(msg, 'error');
        } finally {
            hideLoading(btn);
        }
    };

    function handleAuthSuccess(data) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('username', data.user.name);
        localStorage.setItem('userEmail', data.user.email);

        // Re-init sync service if it exists
        if (window.syncService) {
            if (typeof MongoDBSyncService !== 'undefined') {
                window.syncService = new MongoDBSyncService(window.syncService.apiUrl);
            } else {
                window.location.reload();
                return;
            }
        }

        updateUIState(true);
        authModal.style.display = 'none';

        // Trigger initial sync
        if (window.syncService) {
            window.syncService.syncAll();
        }
    }

    function logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            localStorage.removeItem('userEmail');

            if (typeof MongoDBSyncService !== 'undefined') {
                window.syncService = new MongoDBSyncService(window.syncService.apiUrl);
            }

            updateUIState(false);
            showNotification('Logged out successfully', 'success');

            // Set slight timeout to allow notification to be seen?
            // Actually, reload clears everything.
            // Let's delay reload slightly.
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    function updateUIState(isLoggedIn) {
        if (isLoggedIn) {
            const name = localStorage.getItem('username') || 'User';
            authBtn.textContent = 'Logout';
            usernameDisplay.textContent = `Hi, ${name}`;
            usernameDisplay.style.display = 'inline-block';
        } else {
            authBtn.textContent = 'Login / Sync';
            usernameDisplay.style.display = 'none';
        }
    }
});
