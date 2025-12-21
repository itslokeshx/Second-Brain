class MongoDBSyncService {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.userId = localStorage.getItem('userId');
        this.token = localStorage.getItem('authToken');
        this.syncInProgress = false;

        // Clean up any known corrupted data on init
        this.cleanCorruptedData();
    }

    // Helper to safely parse JSON and handle corrupted data
    safeParse(key, defaultValue) {
        const raw = localStorage.getItem(key);
        if (!raw) return defaultValue;

        if (raw === '[object Object]') {
            console.warn(`[SyncService] Found corrupted data for key "${key}". Clearing it.`);
            localStorage.removeItem(key);
            return defaultValue;
        }

        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error(`[SyncService] Failed to parse key "${key}". Clearing it. Error:`, e);
            localStorage.removeItem(key);
            return defaultValue;
        }
    }

    cleanCorruptedData() {
        const keysToCheck = ['customProjects', 'tasks', 'pomodoroLogs', 'TimerSettings', 'settings'];
        keysToCheck.forEach(key => {
            const val = localStorage.getItem(key);
            if (val === '[object Object]') {
                console.log(`[Cleanup] Removing corrupted key: ${key}`);
                localStorage.removeItem(key);
            }
        });
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    isAuthenticated() {
        return !!this.token && !!this.userId;
    }

    async syncAll() {
        if (!this.isAuthenticated()) return;
        if (this.syncInProgress) {
            console.log('Sync already in progress...');
            return;
        }

        if (!navigator.onLine) {
            console.log('Offline. Skipping sync.');
            return;
        }

        this.syncInProgress = true;
        console.log('Starting MongoDB Sync...');

        try {
            await this.syncProjects();
            await this.syncTasks();
            await this.syncLogs();
            await this.syncSettings();
            console.log('✅ MongoDB Sync Complete');
        } catch (error) {
            console.error('❌ MongoDB Sync Failed:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    // --- Projects ---
    async syncProjects() {
        const key = 'customProjects';
        const syncTimeKey = 'lastProjectSync';

        const localData = this.safeParse(key, []);
        const lastSyncTime = localStorage.getItem(syncTimeKey);

        const response = await fetch(`${this.apiUrl}/api/sync/projects`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                projects: localData,
                lastSyncTime: lastSyncTime
            })
        });

        if (!response.ok) throw new Error('Project sync failed');

        const data = await response.json();
        if (data.success && data.projects) {
            const merged = this.mergeProjects(localData, data.projects);
            localStorage.setItem(key, JSON.stringify(merged));
            localStorage.setItem(syncTimeKey, data.syncTime);
        }
    }

    mergeProjects(local, server) {
        // Simple merge: server updates overwrite local if ID matches, new server items added
        // Since we send ALL local items every time (upstream), server handles the merge logic mostly.
        // But here we need to incorporate Downstream changes (new/updated from server)

        const localMap = new Map(local.map(p => [p.id, p]));

        server.forEach(serverProject => {
            // Overwrite/Add local with server version
            localMap.set(serverProject.id, serverProject);
        });

        return Array.from(localMap.values());
    }

    // --- Tasks ---
    async syncTasks() {
        const key = 'tasks';
        const syncTimeKey = 'lastTaskSync';

        const localData = this.safeParse(key, []);
        const lastSyncTime = localStorage.getItem(syncTimeKey);

        const response = await fetch(`${this.apiUrl}/api/sync/tasks`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                tasks: localData,
                lastSyncTime: lastSyncTime
            })
        });

        if (!response.ok) throw new Error('Task sync failed');

        const data = await response.json();
        if (data.success && data.tasks) {
            const merged = this.mergeTasks(localData, data.tasks);
            localStorage.setItem(key, JSON.stringify(merged));
            localStorage.setItem(syncTimeKey, data.syncTime);
        }
    }

    mergeTasks(local, server) {
        const localMap = new Map(local.map(t => [t.id, t]));
        server.forEach(serverTask => {
            localMap.set(serverTask.id, serverTask);
        });
        return Array.from(localMap.values());
    }

    // --- Logs ---
    async syncLogs() {
        const key = 'pomodoroLogs';
        const syncTimeKey = 'lastLogSync';

        const localData = this.safeParse(key, []);
        const lastSyncTime = localStorage.getItem(syncTimeKey);

        const response = await fetch(`${this.apiUrl}/api/sync/logs`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                logs: localData,
                lastSyncTime: lastSyncTime
            })
        });

        if (!response.ok) throw new Error('Log sync failed');

        const data = await response.json();
        if (data.success && data.logs) {
            // Logs are append only usually, just add missing ones
            const merged = this.mergeLogs(localData, data.logs);
            localStorage.setItem(key, JSON.stringify(merged));
            localStorage.setItem(syncTimeKey, data.syncTime);
        }
    }

    mergeLogs(local, server) {
        const localMap = new Map(local.map(l => [l.id, l]));
        server.forEach(serverLog => {
            if (!localMap.has(serverLog.id)) {
                localMap.set(serverLog.id, serverLog);
            }
        });
        return Array.from(localMap.values());
    }

    // --- Settings ---
    async syncSettings() {
        const payload = {
            bgMusic: localStorage.getItem('BgMusic'),
            volume: Number(localStorage.getItem('Volume')),
            timerSettings: this.safeParse('TimerSettings', {})
        };

        const response = await fetch(`${this.apiUrl}/api/sync/settings`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ settings: payload })
        });

        if (!response.ok) throw new Error('Settings sync failed');

        const data = await response.json();
        if (data.success && data.settings) {
            const s = data.settings;
            if (s.bgMusic) localStorage.setItem('BgMusic', s.bgMusic);
            if (s.volume !== undefined) localStorage.setItem('Volume', s.volume);
            if (s.timerSettings && Object.keys(s.timerSettings).length > 0) {
                localStorage.setItem('TimerSettings', JSON.stringify(s.timerSettings));
            }
        }
    }
}

// Initialize globally
const API_URL = 'http://localhost:3000';
window.syncService = new MongoDBSyncService(API_URL);

// Auto-sync interval (every 5 minutes)
setInterval(() => {
    if (window.syncService) {
        window.syncService.syncAll();
    }
}, 5 * 60 * 1000);

// Sync when coming online
window.addEventListener('online', () => {
    if (window.syncService) {
        console.log('Online detected, syncing...');
        window.syncService.syncAll();
    }
});

// Intercept localStorage.setItem to trigger instant syncs
(function () {
    const originalSetItem = localStorage.setItem;

    // Debounce helpers to prevent spamming the API
    let timeoutProjects, timeoutTasks, timeoutLogs, timeoutSettings;

    localStorage.setItem = function (key, value) {
        // Call original
        originalSetItem.apply(this, arguments);

        // Trigger Sync based on key
        if (!window.syncService || !window.syncService.isAuthenticated()) return;

        if (key === 'customProjects') {
            clearTimeout(timeoutProjects);
            timeoutProjects = setTimeout(() => window.syncService.syncProjects(), 2000); // 2s debounce
        }
        else if (key === 'tasks') {
            clearTimeout(timeoutTasks);
            timeoutTasks = setTimeout(() => window.syncService.syncTasks(), 2000);
        }
        else if (key === 'pomodoroLogs') {
            clearTimeout(timeoutLogs);
            timeoutLogs = setTimeout(() => window.syncService.syncLogs(), 2000);
        }
        else if (['TimerSettings', 'BgMusic', 'Volume', 'settings'].includes(key)) {
            clearTimeout(timeoutSettings);
            timeoutSettings = setTimeout(() => window.syncService.syncSettings(), 2000);
        }
    };
})();
