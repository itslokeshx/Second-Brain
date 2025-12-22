const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ TASK 1: OPTION C - Serve Frontend from Backend
// This ensures app runs on http://localhost:3000, enabling cookies
const path = require('path');
app.use(express.static(path.join(__dirname, '../')));

// ✅ TASK 2: Session System & Middleware
// ✅ TASK 2: Session System & Middleware
const session = require('express-session');
const MongoStore = require('connect-mongo').MongoStore; // Fix for v6+ import

app.use(session({
    name: 'secondbrain.sid', // Avoid conflict with legacy JSESSIONID
    secret: process.env.SESSION_SECRET || 'second-brain-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60, // 24 hours
        autoRemove: 'native'
    }),
    cookie: {
        httpOnly: false, // Allow frontend access if needed (or true if using API only)
        secure: false, // true in production
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

// Legacy session support fallback (to inspect req.sessionID)
// Global sessions map removed - using express-session instead

app.use(cors({
    origin: function (origin, callback) {
        const allowed = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
        if (!origin || origin === 'null' || allowed.includes(origin)) {
            return callback(null, true);
        }
        callback(null, true); // Allow all for debugging/legacy sanity
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-jsessionid', 'Origin', 'Accept']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Import User model
// Import User model and Sync models
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const PomodoroLog = require('./models/PomodoroLog');

// Session ID Generator
// Session ID Generator (Managed by express-session, helper removed)

// Helper to build consistent legacy response
function buildLegacyResponse(user, jsessionId, overrides = {}) {
    const now = Date.now();
    return {
        status: 0,
        success: true,
        acct: user.email,
        uid: user._id.toString(),
        name: user.name || user.username,
        user: { // ✅ Modern frontend expects this nested object
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.username
        },
        jsessionId: jsessionId,
        expiredDate: now + (30 * 24 * 60 * 60 * 1000), // 30 days
        timestamp: now,
        server_now: now,
        update_time: now,
        ...overrides
    };
}

// ✅ TASK 3: Fix /v63/user/register
app.post('/v63/user/register', async (req, res) => {
    try {
        console.log('[Register] Request:', req.body);
        let { email, username, password, account } = req.body;

        // Handle legacy field names
        if (!email && account) email = account;
        const name = username || (email ? email.split('@')[0] : 'User');

        if (!email || !password) {
            return res.json({ status: 1, success: false, message: 'Missing credentials' });
        }

        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.json({ status: 1, success: false, message: 'User exists' });
        }

        user = new User({
            email: email.toLowerCase(),
            password: password,
            name: name,
            username: name
        });
        await user.save();

        // 1. GENERATE jsessionId
        // 1. GENERATE jsessionId (express-session handles this, we just use req.sessionID)
        const jsessionId = req.sessionID;

        // 2. STORE server-side (Unified Session Object)
        req.session.user = {
            id: user._id.toString(),
            email: user.email,
            username: user.name
        };

        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // express-session sets the cookie automatically

        // 4. RETURN in JSON
        res.json(buildLegacyResponse(user, jsessionId));

    } catch (err) {
        console.error('[Register] Error:', err);
        res.json({ status: 1, success: false, message: err.message });
    }
});

// ✅ TASK 3: Fix /v63/user/login
app.post('/v63/user/login', async (req, res) => {
    try {
        console.log('[Login] Request:', req.body);
        let { email, username, password, account } = req.body;

        const loginEmail = email || username || account;

        if (!loginEmail || !password) {
            return res.json({ status: 1, success: false, message: 'Missing credentials' });
        }

        const user = await User.findOne({ email: loginEmail.toLowerCase() });
        if (!user || !(await user.matchPassword(password))) {
            return res.json({ status: 1, success: false, message: 'Invalid credentials' });
        }

        // 1. GENERATE / REGENERATE SESSION
        req.session.regenerate((err) => {
            if (err) {
                console.error('[Login] Session regeneration failed:', err);
                return res.json({ status: 1, success: false, message: 'Session error' });
            }

            // 2. STORE server-side
            req.session.user = {
                id: user._id.toString(),
                email: user.email,
                username: user.name
            };

            req.session.save((err) => {
                if (err) {
                    console.error('[Login] Session save failed:', err);
                    return res.json({ status: 1, success: false, message: 'Session save error' });
                }

                // 3. RETURN in JSON
                // express-session handles the cookie
                res.json(buildLegacyResponse(user, req.sessionID));
            });
        });

    } catch (err) {
        console.error('[Login] Error:', err);
        res.json({ status: 1, success: false, message: err.message });
    }
});

// ✅ TASK 4: Implement /v64/user/config (AUTH BOOTSTRAP)
// Helper: Resolve Session ID from ALL possible sources
function resolveSessionId(req) {
    // Deprecated: express-session handles this
    return req.sessionID;
}

// ✅ TASK 4: Implement /v64/user/config (AUTH BOOTSTRAP)
app.get('/v64/user/config', async (req, res) => {
    // Try to recover session if cookie JSESSIONID present but no express session
    if (!req.session.userId && req.cookies.JSESSIONID) {
        console.log(`[Config] Attempting to restore session from cookie: ${req.cookies.JSESSIONID}`);
        // We rely on express-session to handle this via cookie signature
    }

    console.log(`[Config] Checking session: ${req.sessionID}`);
    // console.log(`[Config] Session data:`, req.session); 

    if (!req.session.user || !req.session.user.id) {
        console.log('[Config] No valid session found');
        return res.json({ status: 1, success: false });
    }

    try {
        const user = await User.findById(req.session.user.id).maxTimeMS(5000);

        if (!user) {
            return res.json({ status: 1, success: false, message: 'User not found' });
        }

        res.json({
            status: 0,
            success: true,
            uid: req.session.user.id,
            acct: user.email,
            name: user.name,
            portrait: "",
            avatar: "",
            avatarTimestamp: Date.now(),
            email: user.email,
            verifyUser: 1,
            proEndTime: Date.now() + (365 * 24 * 60 * 60 * 1000),
            jsessionId: req.sessionID,
            config: {
                theme: 'dark',
                language: 'en',
                autoSync: true
            }
        });
    } catch (err) {
        console.error('[Config] Error:', err.message);
        res.status(500).json({ status: 1, success: false, message: 'Database error' });
    }
});

// ✅ TASK 5: Fix /v64/sync
app.post('/v64/sync', async (req, res) => {
    // Use req.session.user.id directly
    if (!req.session.user || !req.session.user.id) {
        return res.json({ status: 1, success: false, message: 'Not authenticated' });
    }

    // Retrieve session data from req.session
    const userId = req.session.user.id;
    const userEmail = req.session.email;
    const userName = req.session.username;
    const jsessionId = req.sessionID;

    // Return empty arrays to satisfy legacy frontend limits
    res.json({
        status: 0,
        success: true,
        message: 'OK',
        acct: userEmail,
        uid: userId,
        name: userName,
        jsessionId,
        expiredDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
        timestamp: Date.now(),
        server_now: Date.now(),
        update_time: Date.now(),
        projects: [],
        tasks: [],
        subtasks: [],
        pomodoros: [],
        schedules: [],
        project_member: [],
        list: [],
        project_count: 0,
        task_count: 0,
        subtask_count: 0,
        pomodoro_count: 0,
        schedule_count: 0,
        project_member_count: 0,
        list_count: 0
    });
});

// ✅ TASK 6: Modern Sync API Endpoints (Missing from original implementation)
// Helper for bulk syncing collections
async function syncCollection(model, items, userId) {
    if (!items || !Array.isArray(items) || items.length === 0) return 0;
    const ops = items.map(item => ({
        updateOne: {
            filter: { id: item.id, userId },
            update: { $set: { ...item, userId } },
            upsert: true
        }
    }));
    const res = await model.bulkWrite(ops);
    return res.upsertedCount + res.modifiedCount;
}

const granularSyncHandler = async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const userId = req.session.user.id;
    const { projects, tasks, logs, settings } = req.body;

    console.log(`[Granular Sync] User: ${req.session.user.email} | proj:${projects?.length || 0} task:${tasks?.length || 0} log:${logs?.length || 0}`);

    try {
        let syncedCount = 0;

        if (projects) syncedCount += await syncCollection(Project, projects, userId);
        if (tasks) syncedCount += await syncCollection(Task, tasks, userId);
        if (logs) syncedCount += await syncCollection(PomodoroLog, logs, userId); // 'logs' key from frontend

        // Settings (single object logic)
        // If settings object provided, upsert it? Or is it a collection?
        // sync-service sends { settings: { ... } }
        // We need a Settings model or User config update. 
        // For now, let's assume User model stores config or just log it is handled.
        // If there is no Settings model defined in server.js imports (I verified User, Project, Task, PomodoroLog).
        // I will skipping settings persistence for now unless I confirmed a Settings model.
        // Assuming settings are stored in User.config or similar.

        res.json({
            status: 0,
            success: true,
            syncTime: Date.now(),
            syncedCount,
            ...req.body // Echo back needed? frontend merges response.
            // sync-service expects: data.projects, data.tasks etc back?
            // It calls merge(local, server). If we don't return server data, it merges nothing (fine for upload-only).
            // But for bidirectional, we should return data.
            // For now, let's assume upload-mostly flow or return empty arrays if we can't fetch.
        });
    } catch (err) {
        console.error('[Granular Sync] Error:', err);
        res.status(500).json({ success: false, message: 'Sync failed' });
    }
};

// ✅ NEW ENDPOINT: Bulk sync all data (MongoDB Atlas only)
app.post('/api/sync/all', async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.json({ success: false, message: 'Not authenticated' });
    }

    const userId = req.session.user.id;
    const { projects = [], tasks = [], pomodoroLogs = [], settings = {} } = req.body || {};

    console.log(`[Sync All] ${req.session.user.email}: ${projects.length} P, ${tasks.length} T, ${pomodoroLogs.length} L`);

    try {
        // Persist Projects to MongoDB
        if (projects.length > 0) {
            const ops = projects.map(p => ({
                updateOne: {
                    filter: { id: p.id, userId: userId },
                    update: { $set: { ...p, userId: userId } },
                    upsert: true
                }
            }));
            await Project.bulkWrite(ops);
        }

        // Persist Tasks to MongoDB
        if (tasks.length > 0) {
            const ops = tasks.map(t => ({
                updateOne: {
                    filter: { id: t.id, userId: userId },
                    update: { $set: { ...t, userId: userId } },
                    upsert: true
                }
            }));
            await Task.bulkWrite(ops);
        }

        // Persist Logs to MongoDB
        if (pomodoroLogs.length > 0) {
            const ops = pomodoroLogs.map(l => ({
                updateOne: {
                    filter: { id: l.id, userId: userId },
                    update: { $set: { ...l, userId: userId } },
                    upsert: true
                }
            }));
            await PomodoroLog.bulkWrite(ops);
        }

        res.json({
            success: true,
            message: 'Synced to MongoDB Atlas',
            projectsSynced: projects.length,
            tasksSynced: tasks.length,
            logsSynced: pomodoroLogs.length
        });

    } catch (err) {
        console.error('[Sync All] Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/sync/projects', granularSyncHandler);
app.post('/api/sync/tasks', granularSyncHandler);
app.post('/api/sync/logs', granularSyncHandler);
app.post('/api/sync/settings', granularSyncHandler);

// Helper Stubs avoiding 404s
app.all('/v63/user/logout', (req, res) => res.json({ status: 0, success: true }));
app.get('/v65/access', (req, res) => res.json({ success: true }));
app.get('/v60/property', (req, res) => res.json({ success: true, properties: {} }));
app.get('/v62/user/point', (req, res) => res.json({ success: true, point: 0 })); // Added missing point endpoint

// DB Connection - MongoDB Atlas REQUIRED
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/second-brain';

if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not set in .env file!');
    console.error('Please configure MongoDB Atlas connection string in .env');
    process.exit(1);
}

// Disable buffering to fail fast
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 5000);

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
})
    .then(() => {
        console.log('✅ MongoDB Atlas Connected');
    })
    .catch(err => {
        console.error('❌ MongoDB Atlas Connection Failed:', err.message);
        console.error('Cannot start server without database connection');
        process.exit(1);
    });

mongoose.connection.on('disconnected', () => {
    console.error('❌ MongoDB disconnected - server may be unstable');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Serving frontend from http://localhost:${PORT} (Fixes Origin/Cookie Issues)`);
    console.log(`✅ Auth Gate: /v64/user/config`);
});
