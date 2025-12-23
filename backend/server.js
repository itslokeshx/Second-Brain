const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve Frontend
const path = require('path');
app.use(express.static(path.join(__dirname, '../')));

// DB Connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/second-brain';

// ✅ SOLUTION A: AGGRESSIVE SESSION CONFIG
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

app.use(session({
    name: 'secondbrain.sid',
    secret: process.env.SESSION_SECRET || 'second-brain-secret-key-2025',
    resave: true, // ✅ FORCE session save on every request
    saveUninitialized: true, // ✅ FORCE cookie creation immediately
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        ttl: 24 * 60 * 60,
        autoRemove: 'native',
        touchAfter: 0 // ✅ Update session on every request
    }),
    cookie: {
        httpOnly: false, // ✅ CRITICAL: Allow JavaScript access for debugging
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
        domain: 'localhost' // ✅ EXPLICIT domain
    }
}));

// CORS - MUST be before body parsers
app.use(cors({
    origin: function (origin, callback) {
        const allowed = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
        if (!origin || origin === 'null' || allowed.includes(origin)) {
            return callback(null, true);
        }
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-jsessionid', 'Origin', 'Accept']
}));

// Body parsers - AFTER CORS
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ✅ DUAL-MODE AUTH: Cookie OR Token
app.use((req, res, next) => {
    // Check for token in header (fallback)
    const token = req.headers['x-session-token'] || req.headers['authorization']?.replace('Bearer ', '');

    if (token && !req.session.user) {
        // Token-based auth - reconstruct session from token
        req.sessionID = token;
    }

    console.log(`[${req.method}] ${req.path}`);
    console.log(`  Session ID: ${req.sessionID}`);
    console.log(`  Cookie: ${req.headers.cookie || 'NONE'}`);
    console.log(`  Token: ${token || 'NONE'}`);
    console.log(`  Session User: ${req.session?.user?.email || 'NONE'}`);
    next();
});

// Import Models
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const PomodoroLog = require('./models/PomodoroLog');

// ✅ GUARANTEED AUTH HANDLER
const handleAuth = async (req, res, isLogin = false) => {
    try {
        const { account, password } = req.body;

        if (!account || !password) {
            return res.json({ status: 1, success: false, message: 'Missing credentials' });
        }

        let user;
        if (isLogin) {
            user = await User.findOne({ email: account });
            if (!user) {
                return res.json({ status: 1, success: false, message: 'User not found' });
            }
            // ✅ FIX: Use matchPassword for bcrypt comparison
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.json({ status: 1, success: false, message: 'Invalid password' });
            }
        } else {
            const existing = await User.findOne({ email: account });
            if (existing) {
                return res.json({ status: 1, success: false, message: 'User exists' });
            }
            user = await User.create({
                email: account,
                password: password,
                name: account.split('@')[0],
                createdAt: Date.now()
            });
        }

        // ✅ SET SESSION DATA
        req.session.user = {
            id: user._id.toString(),
            email: user.email,
            username: user.name
        };

        // ✅ FORCE SAVE AND WAIT
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log(`[${isLogin ? 'Login' : 'Register'}] ✅ SUCCESS`);
        console.log(`  User: ${user.email}`);
        console.log(`  Session ID: ${req.sessionID}`);
        console.log(`  Session Data:`, req.session.user);

        // ✅ SET COOKIES - Remove domain to allow JavaScript access
        res.setHeader('Set-Cookie', [
            `ACCT=${encodeURIComponent(user.email)}; Path=/; HttpOnly=false; SameSite=Lax; Max-Age=86400`,
            `NAME=${encodeURIComponent(user.name)}; Path=/; HttpOnly=false; SameSite=Lax; Max-Age=86400`,
            `UID=${user._id.toString()}; Path=/; HttpOnly=false; SameSite=Lax; Max-Age=86400`,
            `secondbrain.sid=${req.sessionID}; Path=/; HttpOnly=false; SameSite=Lax; Max-Age=86400`
        ]);

        // ✅ RESPONSE WITH TOKEN (DUAL MODE)
        res.json({
            status: 0,
            success: true,
            uid: user._id.toString(),
            acct: user.email,
            name: user.name,
            user: req.session.user,
            jsessionId: req.sessionID,
            token: req.sessionID, // ✅ FALLBACK TOKEN
            timestamp: Date.now()
        });

    } catch (err) {
        console.error(`[Auth] ERROR:`, err);
        res.json({ status: 1, success: false, message: err.message });
    }
};

// Auth Routes
app.post('/v63/user/register', (req, res) => handleAuth(req, res, false));
app.post('/v63/user/login', (req, res) => handleAuth(req, res, true));

// ✅ DUAL-MODE VERIFICATION MIDDLEWARE
const verifySession = async (req, res, next) => {
    // Check session cookie first
    if (req.session?.user?.id) {
        req.userId = req.session.user.id;
        req.userEmail = req.session.user.email;
        return next();
    }

    // Fallback to token
    const token = req.headers['x-session-token'] || req.headers['authorization']?.replace('Bearer ', '');
    if (token) {
        // Look up session by ID
        const SessionModel = mongoose.connection.collection('sessions');
        const sessionDoc = await SessionModel.findOne({ _id: token });

        if (sessionDoc?.session) {
            const sessionData = JSON.parse(sessionDoc.session);
            if (sessionData.user?.id) {
                req.userId = sessionData.user.id;
                req.userEmail = sessionData.user.email;
                return next();
            }
        }
    }

    console.log('[Auth] ❌ DENIED - No valid session or token');
    res.status(401).json({ status: 1, success: false, message: 'Not authenticated' });
};

// Config Endpoint
app.get('/v64/user/config', async (req, res) => {
    // Try session first
    if (req.session?.user) {
        return res.json({
            status: 0,
            success: true,
            uid: req.session.user.id,
            acct: req.session.user.email,
            name: req.session.user.username,
            user: req.session.user,
            jsessionId: req.sessionID,
            token: req.sessionID
        });
    }

    // Try token fallback
    const token = req.headers['x-session-token'] || req.headers['authorization']?.replace('Bearer ', '');
    if (token) {
        const SessionModel = mongoose.connection.collection('sessions');
        const sessionDoc = await SessionModel.findOne({ _id: token });

        if (sessionDoc?.session) {
            const sessionData = JSON.parse(sessionDoc.session);
            if (sessionData.user) {
                return res.json({
                    status: 0,
                    success: true,
                    uid: sessionData.user.id,
                    acct: sessionData.user.email,
                    name: sessionData.user.username,
                    user: sessionData.user,
                    jsessionId: token,
                    token: token
                });
            }
        }
    }

    res.json({ status: 1, success: false });
});

// Sync Routes - LOAD DATA FROM MONGODB
app.post('/v64/sync', verifySession, async (req, res) => {
    try {
        const userId = req.userId;

        console.log(`[v64/sync] Loading data for user: ${req.userEmail}`);

        // Load data from MongoDB
        const [projects, tasks, pomodoros] = await Promise.all([
            Project.find({ userId }).select('-_id -__v -userId').lean(),
            Task.find({ userId }).select('-_id -__v -userId').lean(),
            PomodoroLog.find({ userId }).select('-_id -__v -userId').lean()
        ]);

        console.log(`[v64/sync] ✅ Loaded: ${projects.length} projects, ${tasks.length} tasks, ${pomodoros.length} pomodoros`);

        // ✅ NORMALIZE DATA: Add default values for missing fields
        const normalizedProjects = projects.map(p => ({
            ...p,
            type: p.type !== undefined ? p.type : 0,
            color: p.color || '#FF6B6B',
            sortOrder: p.sortOrder !== undefined ? p.sortOrder : 0,
            closed: p.closed || false,
            deleted: p.deleted || false
        }));

        const normalizedTasks = tasks.map(t => ({
            ...t,
            projectId: t.projectId || '',
            priority: t.priority !== undefined ? t.priority : 0,
            completed: t.completed || false,
            deleted: t.deleted || false,
            sortOrder: t.sortOrder !== undefined ? t.sortOrder : 0
        }));

        // Get user info for response
        const user = await User.findById(userId);

        res.json({
            status: 0,
            success: true,
            acct: user.email,
            name: user.name,
            uid: userId,
            pid: userId,
            jsessionId: req.sessionID,
            timestamp: Date.now(),
            server_now: Date.now(),
            update_time: Date.now(),
            projects: normalizedProjects,
            tasks: normalizedTasks,
            pomodoros: pomodoros || [],
            subtasks: [],
            schedules: [],
            project_member: [],
            list: []
        });
    } catch (error) {
        console.error('[v64/sync] ❌ Error:', error);
        res.json({
            status: 1,
            success: false,
            message: error.message
        });
    }
});

app.post('/api/sync/all', verifySession, async (req, res) => {
    try {
        const userId = req.userId;
        const { projects = [], tasks = [], pomodoroLogs = [], settings = {} } = req.body || {};

        console.log(`[Sync All] User: ${req.userEmail}`);
        console.log(`[Sync All] Data received:`, {
            projects: projects.length,
            tasks: tasks.length,
            logs: pomodoroLogs.length
        });

        let projectsSynced = 0;
        let tasksSynced = 0;
        let logsSynced = 0;

        // Sync Projects
        if (projects.length > 0) {
            const ops = projects.map(p => ({
                updateOne: {
                    filter: { id: p.id, userId: userId },
                    update: { $set: { ...p, userId: userId } },
                    upsert: true
                }
            }));
            const result = await Project.bulkWrite(ops);
            projectsSynced = result.upsertedCount + result.modifiedCount;
            console.log(`[Sync All] Projects synced: ${projectsSynced}`);
        }

        // Sync Tasks
        if (tasks.length > 0) {
            const ops = tasks.map(t => ({
                updateOne: {
                    filter: { id: t.id, userId: userId },
                    update: { $set: { ...t, userId: userId } },
                    upsert: true
                }
            }));
            const result = await Task.bulkWrite(ops);
            tasksSynced = result.upsertedCount + result.modifiedCount;
            console.log(`[Sync All] Tasks synced: ${tasksSynced}`);
        }

        // Sync Pomodoro Logs
        if (pomodoroLogs.length > 0) {
            const ops = pomodoroLogs.map(l => ({
                updateOne: {
                    filter: { id: l.id, userId: userId },
                    update: { $set: { ...l, userId: userId } },
                    upsert: true
                }
            }));
            const result = await PomodoroLog.bulkWrite(ops);
            logsSynced = result.upsertedCount + result.modifiedCount;
            console.log(`[Sync All] Logs synced: ${logsSynced}`);
        }

        console.log(`[Sync All] ✅ Complete - P:${projectsSynced} T:${tasksSynced} L:${logsSynced}`);

        res.json({
            success: true,
            message: 'Data synced to MongoDB',
            projectsSynced,
            tasksSynced,
            logsSynced
        });

    } catch (error) {
        console.error('[Sync All] ❌ Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sync failed: ' + error.message
        });
    }
});

// Debug Endpoint
app.get('/debug/cookies', (req, res) => {
    res.json({
        sessionID: req.sessionID,
        cookies: req.cookies,
        headers: req.headers,
        sessionUser: req.session?.user
    });
});

// Helper stubs
app.all('/v63/user/logout', (req, res) => res.json({ status: 0 }));
app.get('/v65/access', (req, res) => res.json({ success: true }));
app.get('/v60/property', (req, res) => res.json({ success: true, properties: {} }));
app.get('/statusv60/property', (req, res) => res.json({ success: true, properties: {} }));
app.get('/v62/user/point', (req, res) => res.json({ success: true, point: 0 }));
app.all('/v63/exception-report', (req, res) => res.json({ status: 0, success: true }));

// Fix undefined route
app.get('/undefined', (req, res) => {
    console.warn('[Warning] Request to /undefined - likely a frontend bug');
    res.status(404).json({ error: 'Invalid route' });
});

// MongoDB Connection
if (!process.env.MONGODB_URI) {
    console.warn('⚠️ Using local MongoDB fallback');
}

mongoose.set('bufferCommands', false);
mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Failed:', err.message);
        process.exit(1);
    });

app.listen(PORT, () => {
    console.log(`✅ Server: http://localhost:${PORT}`);
    console.log(`✅ Dual-Mode Auth: Cookie + Token`);
});
