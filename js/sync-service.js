// ✅ DUAL-MODE SYNC SERVICE (Cookie + Token)
class SyncService {
    constructor() {
        // Use AppConfig if available, fallback to localhost
        this.baseURL = window.AppConfig
            ? window.AppConfig.getApiBaseUrl()
            : 'http://localhost:3000';
        console.log('[Sync] Service initialized - Dual-mode auth');
        console.log('[Sync] Base URL:', this.baseURL);
    }

    // ✅ GUARANTEED AUTHENTICATED FETCH
    async authenticatedFetch(url, options = {}) {
        // ✅ MERGE AUTH HEADERS - Try token if available, but don't require it
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        // Add token header if SessionManager has one
        if (window.SessionManager && window.SessionManager.token) {
            headers['X-Session-Token'] = window.SessionManager.token;
        }

        // Also check localStorage for token fallback
        const storedToken = localStorage.getItem('authToken');
        if (storedToken && !headers['X-Session-Token']) {
            headers['X-Session-Token'] = storedToken;
        }

        const fetchOptions = {
            ...options,
            credentials: 'include', // ✅ Always try cookies
            headers: headers
        };

        console.log('[Sync] Request:', url);

        const response = await fetch(url, fetchOptions);

        if (response.status === 401) {
            console.error('[Sync] 401 Unauthorized');
            throw new Error('Not authenticated');
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    // Sync all data
    async syncAll(data) {
        try {
            const result = await this.authenticatedFetch(`${this.baseURL}/api/sync/all`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            console.log('[Sync] ✅ Success:', result);
            return result;
        } catch (error) {
            console.error('[Sync] ❌ Failed:', error);
            throw error;
        }
    }

    // Sync projects
    async syncProjects(projects) {
        return this.authenticatedFetch(`${this.baseURL}/v64/sync`, {
            method: 'POST',
            body: JSON.stringify({ projects })
        });
    }

    // Sync tasks
    async syncTasks(tasks) {
        return this.authenticatedFetch(`${this.baseURL}/v64/sync`, {
            method: 'POST',
            body: JSON.stringify({ tasks })
        });
    }

    // Load all data from MongoDB
    async loadAll() {
        try {
            const result = await this.authenticatedFetch(`${this.baseURL}/v64/sync`, {
                method: 'POST',
                body: JSON.stringify({}) // Empty body = load request
            });
            console.log('[Sync] ✅ Data loaded:', result);
            return result;
        } catch (error) {
            console.error('[Sync] ❌ Load failed:', error);
            throw error;
        }
    }

    // Check if authenticated
    isAuthenticated() {
        return window.SessionManager && window.SessionManager.currentUser !== null;
    }
}

// Export globally
window.SyncService = new SyncService();
console.log('[Sync] Service ready');
