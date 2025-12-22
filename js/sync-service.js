// ✅ DUAL-MODE SYNC SERVICE (Cookie + Token)
class SyncService {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        console.log('[Sync] Service initialized - Dual-mode auth');
    }

    // ✅ GUARANTEED AUTHENTICATED FETCH
    async authenticatedFetch(url, options = {}) {
        // Check authentication
        if (!window.SessionManager || !window.SessionManager.currentUser) {
            throw new Error('Not authenticated');
        }

        // ✅ MERGE AUTH HEADERS
        const headers = {
            'Content-Type': 'application/json',
            ...window.SessionManager.getAuthHeaders(), // Token if available
            ...(options.headers || {})
        };

        const fetchOptions = {
            ...options,
            credentials: 'include', // ✅ Always try cookies
            headers: headers
        };

        console.log('[Sync] Request:', url);
        console.log('[Sync] Headers:', headers);

        const response = await fetch(url, fetchOptions);

        if (response.status === 401) {
            console.error('[Sync] 401 Unauthorized - re-checking session');
            await window.SessionManager.checkLoginStatus();
            throw new Error('Authentication expired');
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

    // Check if authenticated
    isAuthenticated() {
        return window.SessionManager && window.SessionManager.currentUser !== null;
    }
}

// Export globally
window.SyncService = new SyncService();
console.log('[Sync] Service ready');
