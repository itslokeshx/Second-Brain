
(function () {
    'use strict';

    const DB_VERSION = 2;  // Must match main.js version exactly
    const PROJECT_STORE = 'Project';

    // Get user-scoped DB name (requires UserDB to be loaded first)
    function getDBName() {
        if (!window.UserDB) {
            console.warn('[Guardian] UserDB not loaded');
            return null;
        }

        const userId = window.UserDB.getCurrentUserId();
        if (!userId) {
            // No user logged in - this is OK, Guardian will initialize after login
            return null;
        }

        return window.UserDB.getDBName();
    }

    // Guardian state
    const Guardian = {
        db: null,
        isSeeding: false,
        initialized: false,
        seedPromise: null
    };

    /**
     * Open IndexedDB connection
     */
    async function openDB() {
        if (Guardian.db) return Guardian.db;

        return new Promise((resolve, reject) => {
            const dbName = getDBName();
            const request = indexedDB.open(dbName, DB_VERSION);

            request.onerror = () => {
                console.error('[Guardian] ❌ Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                Guardian.db = request.result;
                resolve(Guardian.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create Project store with all indexes main.js expects
                if (!db.objectStoreNames.contains(PROJECT_STORE)) {
                    const store = db.createObjectStore(PROJECT_STORE, { keyPath: 'id' });
                    store.createIndex('state', 'state', { unique: false });
                    store.createIndex('sync', 'sync', { unique: false });
                    store.createIndex('parentId', 'parentId', { unique: false });
                }

                // Create Task store with all indexes main.js expects
                if (!db.objectStoreNames.contains('Task')) {
                    const store = db.createObjectStore('Task', { keyPath: 'id' });
                    store.createIndex('projectId', 'projectId', { unique: false });
                    store.createIndex('deadline', 'deadline', { unique: false });
                    store.createIndex('reminderDate', 'reminderDate', { unique: false });
                    store.createIndex('finishedDate', 'finishedDate', { unique: false });
                    store.createIndex('sync', 'sync', { unique: false });
                }

                // Create Subtask store with all indexes main.js expects
                if (!db.objectStoreNames.contains('Subtask')) {
                    const store = db.createObjectStore('Subtask', { keyPath: 'id' });
                    store.createIndex('taskId', 'taskId', { unique: false });
                    store.createIndex('sync', 'sync', { unique: false });
                    store.createIndex('finishedDate', 'finishedDate', { unique: false });
                }

                // Create Pomodoro store with all indexes main.js expects
                if (!db.objectStoreNames.contains('Pomodoro')) {
                    const store = db.createObjectStore('Pomodoro', { keyPath: 'id' });
                    store.createIndex('taskId', 'taskId', { unique: false });
                    store.createIndex('subtaskId', 'subtaskId', { unique: false });
                    store.createIndex('endDate', 'endDate', { unique: false });
                    store.createIndex('sync', 'sync', { unique: false });
                }

                // Create Schedule store with all indexes main.js expects
                if (!db.objectStoreNames.contains('Schedule')) {
                    const store = db.createObjectStore('Schedule', { keyPath: 'id' });
                    store.createIndex('taskId', 'taskId', { unique: false });
                    store.createIndex('subtaskId', 'subtaskId', { unique: false });
                    store.createIndex('endDate', 'endDate', { unique: false });
                    store.createIndex('sync', 'sync', { unique: false });
                }

                // Create Group store (main.js:26936-26943)
                if (!db.objectStoreNames.contains('Group')) {
                    const store = db.createObjectStore('Group', { keyPath: 'groupId' });
                    store.createIndex('groupLeader', 'groupLeader', { unique: false });
                    store.createIndex('createdDate', 'createdDate', { unique: false });
                    store.createIndex('secret', 'secret', { unique: false });
                    store.createIndex('membersNum', 'membersNum', { unique: false });
                }

                // Create GroupUser store (main.js:26945-26961)
                if (!db.objectStoreNames.contains('GroupUser')) {
                    const store = db.createObjectStore('GroupUser', { keyPath: 'id' });
                    store.createIndex('groupId', 'groupId', { unique: false });
                    store.createIndex('uuid', 'uuid', { unique: false });
                    store.createIndex('sync', 'sync', { unique: false });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('todayPomodoroTime', 'todayPomodoroTime', { unique: false });
                    store.createIndex('weekPomodoroTime', 'weekPomodoroTime', { unique: false });
                    store.createIndex('focusEndDate', 'focusEndDate', { unique: false });
                }

                // Create Message store (main.js:26963-26979)
                if (!db.objectStoreNames.contains('Message')) {
                    const store = db.createObjectStore('Message', { keyPath: 'messageId' });
                    store.createIndex('groupId', 'groupId', { unique: false });
                    store.createIndex('userId', 'userId', { unique: false });
                    store.createIndex('state', 'state', { unique: false });
                    store.createIndex('sync', 'sync', { unique: false });
                    store.createIndex('creationDate', 'creationDate', { unique: false });
                    store.createIndex('replyUserId', 'replyUserId', { unique: false });
                    store.createIndex('replyMessageId', 'replyMessageId', { unique: false });
                    store.createIndex('parentId', 'parentId', { unique: false });
                    store.createIndex('username', 'username', { unique: false });
                }
            };
        });
    }

    /**
     * Get all existing projects from IndexedDB
     */
    async function getExistingProjects() {
        const db = await openDB();
        return new Promise((resolve) => {
            try {
                const tx = db.transaction(PROJECT_STORE, 'readonly');
                const store = tx.objectStore(PROJECT_STORE);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => {
                    console.warn('[Guardian] Error reading projects:', request.error);
                    resolve([]);
                };
            } catch (e) {
                console.warn('[Guardian] Transaction error:', e);
                resolve([]);
            }
        });
    }

    /**
     * CORE: Seed missing system projects into IndexedDB
     * This MUST complete before main.js tries to read projects
     */
    async function seedSystemProjects() {
        if (Guardian.isSeeding) {
            return Guardian.seedPromise;
        }

        Guardian.isSeeding = true;
        Guardian.seedPromise = (async () => {

            // Ensure SYSTEM_PROJECTS is defined
            if (!window.SYSTEM_PROJECTS || !Array.isArray(window.SYSTEM_PROJECTS)) {
                console.error('[Guardian] ❌ SYSTEM_PROJECTS not defined! Load system-projects.js first.');
                Guardian.isSeeding = false;
                return false;
            }

            try {
                const db = await openDB();
                const existing = await getExistingProjects();
                const existingMap = new Map(existing.map(p => [String(p.id), p]));

                // Check for missing OR wrong-type projects
                const toUpdate = [];
                const toInsert = [];

                for (const sysProj of window.SYSTEM_PROJECTS) {
                    const existingProj = existingMap.get(String(sysProj.id));

                    if (!existingProj) {
                        // Project doesn't exist - insert it
                        toInsert.push(sysProj);
                    } else if (Number(existingProj.type) !== Number(sysProj.type)) {
                        // Project exists but has WRONG type - update it
                        toUpdate.push({
                            ...existingProj,
                            type: sysProj.type,
                            deadline: sysProj.deadline || sysProj.type,
                            modifiedDate: Date.now()
                        });
                    }
                }

                if (toInsert.length === 0 && toUpdate.length === 0) {
                    Guardian.isSeeding = false;
                    return true;
                }


                // Insert/update projects
                const tx = db.transaction(PROJECT_STORE, 'readwrite');
                const store = tx.objectStore(PROJECT_STORE);

                for (const project of toInsert) {
                    const projectWithTimestamp = {
                        ...project,
                        state: project.state !== undefined ? project.state : 0, // CRITICAL for state index
                        order: project.order !== undefined ? project.order : 0,
                        sync: project.sync !== undefined ? project.sync : 1,
                        createdDate: Date.now(),
                        modifiedDate: Date.now()
                    };
                    store.put(projectWithTimestamp);
                }

                for (const project of toUpdate) {
                    // Ensure state is set for index compatibility
                    if (project.state === undefined) project.state = 0;
                    store.put(project);
                }


                await new Promise((resolve, reject) => {
                    tx.oncomplete = resolve;
                    tx.onerror = () => reject(tx.error);
                });

                Guardian.isSeeding = false;
                return true;

            } catch (error) {
                console.error('[Guardian] ❌ Seeding failed:', error);
                Guardian.isSeeding = false;
                return false;
            }
        })();

        return Guardian.seedPromise;
    }

    /**
     * Validate that all required system projects exist
     */
    async function validateIntegrity() {
        if (!window.SYSTEM_PROJECTS) {
            console.warn('[Guardian] Cannot validate - SYSTEM_PROJECTS not loaded');
            return { valid: false, missing: [] };
        }

        const existing = await getExistingProjects();
        const existingIds = new Set(existing.map(p => String(p.id)));
        const missing = window.SYSTEM_PROJECTS.filter(p => !existingIds.has(String(p.id)));

        const result = {
            valid: missing.length === 0,
            total: window.SYSTEM_PROJECTS.length,
            found: window.SYSTEM_PROJECTS.length - missing.length,
            missing: missing.map(p => p.id)
        };

        if (!result.valid) {
            console.warn('[Guardian] ⚠️ Missing system projects:', result.missing.join(', '));
        } else {
        }

        return result;
    }

    /**
     * Force reseed - useful for recovery
     */
    async function forceReseed() {
        Guardian.isSeeding = false; // Reset flag

        if (!window.SYSTEM_PROJECTS) {
            console.error('[Guardian] ❌ SYSTEM_PROJECTS not defined!');
            return false;
        }

        try {
            const db = await openDB();
            const tx = db.transaction(PROJECT_STORE, 'readwrite');
            const store = tx.objectStore(PROJECT_STORE);

            for (const project of window.SYSTEM_PROJECTS) {
                const projectWithTimestamp = {
                    ...project,
                    createdDate: Date.now(),
                    modifiedDate: Date.now()
                };
                store.put(projectWithTimestamp);
            }

            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
            });

            return true;
        } catch (error) {
            console.error('[Guardian] ❌ Force reseed failed:', error);
            return false;
        }
    }

    /**
     * List all projects (for debugging)
     */
    async function listProjects() {
        const projects = await getExistingProjects();
        console.table(projects.map(p => ({
            id: p.id,
            name: p.name,
            type: p.type,
            isSystem: p.isSystem || false
        })));
        return projects;
    }

    /**
     * PROTECTION: Intercept IndexedDB delete operations
     * Prevents accidental deletion of system projects
     */
    function installDeleteProtection() {
        const originalDelete = IDBObjectStore.prototype.delete;

        IDBObjectStore.prototype.delete = function (key) {
            // Only protect Project store
            if (this.name === PROJECT_STORE && window.isSystemProject && window.isSystemProject(key)) {
                console.warn('[Guardian] 🛡️ BLOCKED deletion of system project:', key);
                // Return a fake successful request that does nothing
                const fakeRequest = {
                    result: undefined,
                    error: null,
                    source: this,
                    transaction: this.transaction,
                    readyState: 'done',
                    onsuccess: null,
                    onerror: null
                };
                setTimeout(() => {
                    if (fakeRequest.onsuccess) fakeRequest.onsuccess({ target: fakeRequest });
                }, 0);
                return fakeRequest;
            }
            return originalDelete.call(this, key);
        };

    }

    /**
     * PROTECTION: Intercept clear operations
     * After a clear, automatically reseed system projects
     */
    function installClearProtection() {
        const originalClear = IDBObjectStore.prototype.clear;

        IDBObjectStore.prototype.clear = function () {
            const storeName = this.name;
            const result = originalClear.call(this);

            if (storeName === PROJECT_STORE) {
                // Schedule reseed after transaction completes
                result.onsuccess = (function (originalOnsuccess) {
                    return function (event) {
                        if (originalOnsuccess) originalOnsuccess.call(this, event);
                        // Reseed after a short delay to ensure transaction is complete
                        setTimeout(() => {
                            forceReseed().catch(console.error);
                        }, 100);
                    };
                })(result.onsuccess);
            }

            return result;
        };

    }

    /**
     * SPY: Intercept put operations to trace Task completion
     * Logs the object being written to debug sync/state issues
     */
    function installPutProtection() {
        const originalPut = IDBObjectStore.prototype.put;

        IDBObjectStore.prototype.put = function (value, key) {
            if (this.name === 'Task') {
            }
            return originalPut.call(this, value, key);
        };

    }


    function installDeleteDatabaseProtection() {
        const originalDeleteDatabase = indexedDB.deleteDatabase.bind(indexedDB);

        indexedDB.deleteDatabase = function (name) {
            // Protect all user-scoped databases (PomodoroDB6_*)
            if (name && name.startsWith('PomodoroDB6_')) {
                // ALWAYS block deletion of PomodoroDB6 - never allow it
                console.warn('[Guardian] 🛡️ BLOCKED deleteDatabase("' + name + '") - DB protected');

                // Return a fake request that succeeds without doing anything
                const fakeRequest = {
                    result: undefined,
                    error: null,
                    readyState: 'done',
                    onsuccess: null,
                    onerror: null,
                    onblocked: null
                };

                // Trigger onsuccess callback after a microtask
                setTimeout(() => {
                    if (fakeRequest.onsuccess) {
                        fakeRequest.onsuccess({ target: fakeRequest });
                    }
                }, 0);

                return fakeRequest;
            }

            // Allow deletion of other databases
            return originalDeleteDatabase(name);
        };

    }

    /**
     * Merge cloud projects with system projects
     * Used by sync handlers to preserve system projects
     */
    function mergeWithSystemProjects(cloudProjects) {
        if (!window.SYSTEM_PROJECTS) {
            console.warn('[Guardian] Cannot merge - SYSTEM_PROJECTS not loaded');
            return cloudProjects;
        }

        const merged = [...window.SYSTEM_PROJECTS];
        const systemIds = window.SYSTEM_PROJECT_IDS;

        // Add non-system cloud projects
        for (const cloudProject of cloudProjects) {
            if (!systemIds.has(String(cloudProject.id))) {
                merged.push(cloudProject);
            } else {
                // Merge cloud data with system project, preserving isSystem flag
                const idx = merged.findIndex(p => p.id === cloudProject.id);
                if (idx !== -1) {
                    merged[idx] = {
                        ...merged[idx],
                        ...cloudProject,
                        isSystem: true  // Always preserve system flag
                    };
                }
            }
        }



        return merged;
    }

    /**
     * Initialize the Guardian
     */
    async function initialize() {
        if (Guardian.initialized) {
            return;
        }

        // Check if user is logged in - if not, skip initialization
        // The hydration gate will handle seeding after login
        const dbName = getDBName();
        if (!dbName) {

            // CRITICAL: Mark as initialized so guardian-loader releases main.js
            Guardian.initialized = true;
            return;
        }


        // Install other protections (deleteDatabase protection already installed synchronously)
        installDeleteProtection();
        installClearProtection();
        installPutProtection(); // ✅ Added Spy

        // Seed system projects
        await seedSystemProjects();

        // Validate
        await validateIntegrity();

        Guardian.initialized = true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════
    window.IndexedDBGuardian = {
        initialize,
        seed: seedSystemProjects,
        forceReseed,
        validate: validateIntegrity,
        listProjects,
        mergeWithSystemProjects,
        openDB,
        get isInitialized() { return Guardian.initialized; }
    };


    installDeleteDatabaseProtection();



    // Now start async initialization for seeding
    (async () => {
        try {
            await initialize();
        } catch (error) {
            console.error('[Guardian] ❌ Critical initialization error:', error);
            // Attempt recovery
            setTimeout(() => {
                forceReseed().catch(console.error);
            }, 500);
        }
    })();

})();
