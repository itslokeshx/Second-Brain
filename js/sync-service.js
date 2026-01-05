// ✅ CENTRALIZED AUTH - Uses AuthFetch wrapper
class SyncService {
    constructor() {
        // Use AppConfig if available, fallback to localhost
        this.baseURL = window.AppConfig
            ? window.AppConfig.getApiBaseUrl()
            : 'http://localhost:3000';

    }

    // Sync all data
    async syncAll(data) {
        try {
            const response = await window.AuthFetch.post(`${this.baseURL}/api/sync/all`, data);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('[Sync] ❌ Failed:', error);
            throw error;
        }
    }

    // Sync projects
    async syncProjects(projects) {
        const response = await window.AuthFetch.post(`${this.baseURL}/api/sync-data`, { projects });
        return response.json();
    }

    // Sync tasks
    async syncTasks(tasks) {
        const response = await window.AuthFetch.post(`${this.baseURL}/api/sync-data`, { tasks });
        return response.json();
    }

    // Load all data from MongoDB
    async loadAll() {
        try {
            const response = await window.AuthFetch.post(`${this.baseURL}/api/sync-data`, {});
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('[Sync] ❌ Load failed:', error);
            throw error;
        }
    }

    // Check if authenticated
    isAuthenticated() {
        return window.AuthFetch?.isAuthenticated() || false;
    }
}

// Export globally
window.SyncService = new SyncService();
