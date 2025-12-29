const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve Frontend - NO CACHE for critical files
const path = require('path');
app.use(express.static(path.join(__dirname, '../'), {
    setHeaders: (res, filepath) => {
        // Disable caching for HTML and JS files
        if (filepath.endsWith('.html') || filepath.endsWith('.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// DB Connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/second-brain';

// ✅ SOLUTION A: AGGRESSIVE SESSION CONFIG
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(session({
    name: 'secondbrain.sid',
    secret: process.env.SESSION_SECRET || 'second-brain-secret-key-2025',
    resave: true, // ✅ FORCE session save on every request
    saveUninitialized: true, // ✅ FORCE cookie creation immediately
    store: new (MongoStore.default || MongoStore)({
        mongoUrl: MONGODB_URI,
        ttl: 24 * 60 * 60,
        autoRemove: 'native',
        touchAfter: 0 // ✅ Update session on every request
    }),
    cookie: {
        httpOnly: false, // Allow JavaScript access for session management
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
        // No domain specified - works for any domain
    }
}));

// CORS - MUST be before body parsers
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:8000', 'https://second-brain-hub.vercel.app', 'https://itslokeshx.github.io', 'https://itslokeshx.github.io/Second-Brain/'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || origin === 'null') {
            return callback(null, true);
        }
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // In development, allow all origins
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-jsessionid', 'x-session-token', 'Origin', 'Accept']
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
const Pomodoro = require('./models/Pomodoro');

// Rate limiting for auth endpoints
const authAttempts = new Map();
const MAX_ATTEMPTS = 10; // Increased for development testing
const LOCKOUT_TIME = 5 * 60 * 1000; // 5 minutes (reduced for testing)

const checkRateLimit = (ip) => {
    const now = Date.now();
    const attempts = authAttempts.get(ip) || { count: 0, firstAttempt: now, lockedUntil: 0 };

    // Check if locked out
    if (attempts.lockedUntil > now) {
        const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
        return { allowed: false, message: `Too many failed attempts. Try again in ${remainingTime} minutes.` };
    }

    // Reset if first attempt was more than lockout time ago
    if (now - attempts.firstAttempt > LOCKOUT_TIME) {
        authAttempts.set(ip, { count: 1, firstAttempt: now, lockedUntil: 0 });
        return { allowed: true };
    }

    // Increment attempts
    attempts.count++;

    // Lock out if too many attempts
    if (attempts.count > MAX_ATTEMPTS) {
        attempts.lockedUntil = now + LOCKOUT_TIME;
        authAttempts.set(ip, attempts);
        return { allowed: false, message: `Too many failed attempts. Locked out for ${LOCKOUT_TIME / 1000 / 60} minutes.` };
    }

    authAttempts.set(ip, attempts);
    return { allowed: true };
};

const recordFailedAttempt = (ip) => {
    const attempts = authAttempts.get(ip) || { count: 0, firstAttempt: Date.now(), lockedUntil: 0 };
    attempts.count++;
    authAttempts.set(ip, attempts);
};

const clearAttempts = (ip) => {
    authAttempts.delete(ip);
};

// ✅ GUARANTEED AUTH HANDLER
const handleAuth = async (req, res, isLogin = false) => {
    try {
        // Get client IP
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

        // RATE LIMITING DISABLED - Unlimited login attempts allowed
        // const rateCheck = checkRateLimit(clientIp);
        // if (!rateCheck.allowed) {
        //     console.log(`[Auth] ❌ Rate limit exceeded for IP: ${clientIp}`);
        //     return res.json({ status: 1, success: false, message: rateCheck.message });
        // }

        const { account, password } = req.body;

        console.log(`[Auth] ${isLogin ? 'LOGIN' : 'REGISTER'} attempt for:`, account);
        console.log(`[Auth] Password provided:`, password ? 'YES' : 'NO');
        console.log(`[Auth] Password length:`, password?.length || 0);

        if (!account || !password) {
            console.log('[Auth] ❌ Missing credentials');
            return res.json({ status: 1, success: false, message: 'Missing credentials' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(account)) {
            console.log('[Auth] ❌ Invalid email format');
            return res.json({ status: 1, success: false, message: 'Invalid email format' });
        }

        // Validate password length
        if (password.length < 6 || password.length > 100) {
            console.log('[Auth] ❌ Invalid password length');
            return res.json({ status: 1, success: false, message: 'Password must be 6-100 characters' });
        }

        let user;
        if (isLogin) {
            console.log('[Auth] Looking up user in database...');
            user = await User.findOne({ email: account });

            if (!user) {
                console.log('[Auth] ❌ User not found in database');
                // User explicitly requested to know if account doesn't exist to prompt registration
                return res.json({ status: 1, success: false, message: 'Account not found. Please register.' });
            }

            console.log('[Auth] User found, verifying password...');
            console.log('[Auth] Stored hash:', user.password?.substring(0, 20) + '...');

            // ✅ FIX: Use matchPassword for bcrypt comparison
            const isMatch = await user.matchPassword(password);

            console.log('[Auth] Password match result:', isMatch);

            if (!isMatch) {
                console.log('[Auth] ❌ Password verification failed');
                recordFailedAttempt(clientIp);
                return res.json({ status: 1, success: false, message: 'Invalid email or password' });
            }

            console.log('[Auth] ✅ Password verified successfully');
            clearAttempts(clientIp); // Clear failed attempts on successful login
        } else {
            console.log('[Auth] Checking if user already exists...');
            const existing = await User.findOne({ email: account });

            if (existing) {
                console.log('[Auth] ❌ User already exists');
                return res.json({ status: 1, success: false, message: 'Email already registered' });
            }

            console.log('[Auth] Creating new user...');
            user = await User.create({
                email: account,
                password: password,
                name: account.split('@')[0],
                createdAt: Date.now()
            });
            console.log('[Auth] ✅ User created successfully');
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
        // ✅ CRITICAL: Set PID=0 (default project ID) - main.js requires this or it crashes
        res.setHeader('Set-Cookie', [
            `ACCT=${encodeURIComponent(user.email)}; Path=/; HttpOnly=false; SameSite=Lax; Max-Age=86400`,
            `NAME=${encodeURIComponent(user.name)}; Path=/; HttpOnly=false; SameSite=Lax; Max-Age=86400`,
            `UID=${user._id.toString()}; Path=/; HttpOnly=false; SameSite=Lax; Max-Age=86400`,
            `PID=0; Path=/; HttpOnly=false; SameSite=Lax; Max-Age=86400`,
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

// ✅ LEGACY ROUTE SUPPORT (Prevent 404s)
app.get('/v61/user/groups', (req, res) => {
    res.json({ status: 0, success: true, groups: [] });
});

app.get('/v61/group/more', (req, res) => {
    res.json({ status: 0, success: true, list: [] });
});

app.get('/v63/exception-report', (req, res) => {
    res.json({ status: 0, success: true });
});

app.get('/v62/user/point', (req, res) => {
    res.json({ status: 0, success: true, point: 0 });
});

app.get('/v65/access', (req, res) => {
    res.json({ status: 0, success: true });
});

app.get('/v60/property', (req, res) => {
    res.json({ status: 0, success: true });
});

// ✅ Additional legacy user endpoints (POST)
app.post('/v61/user', (req, res) => {
    res.json({ status: 0, success: true });
});

app.post('/v63/user', (req, res) => {
    res.json({ status: 0, success: true });
});

app.get('/undefined', (req, res) => {
    res.status(200).send(''); // Prevent 404 for undefined
});


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
// ✅ ALIAS for sync to avoid AdBlock/DevTools blocking
const syncHandler = async (req, res) => {
    try {
        const { projects, tasks, pomodoros } = req.body;
        const userId = req.userId;

        console.log(`[Sync] 📥 User: ${req.userEmail} (${userId})`);

        // If body is empty, it's a load request
        if (!projects && !tasks && !pomodoros) {
            const [projects, tasks, pomodoros] = await Promise.all([
                Project.find({ userId }).select('-_id -__v -userId').lean(),
                Task.find({ userId }).select('-_id -__v -userId').lean(),
                Pomodoro.find({ userId }).select('-_id -__v -userId').lean()
            ]);

            console.log(`[Sync] ✅ Loaded: ${projects.length} projects, ${tasks.length} tasks, ${pomodoros.length} pomodoros`);

            // ... (rest of the logic will need to be refactored or copied)
            // better to just use the existing function if possible, but I need to extract it first.
            // OR just map both routes to the same inline function.

            // Actually, I can't easily extract the inline function without rewriting a huge block.
            // I'll just change the app.post line to handle both or mount it on a variable.
        }
        // ...
    } catch (e) {
        // ...
    }
}

// Update the line to use array of paths or just add another line
app.post(['/v64/sync', '/api/sync-data'], verifySession, async (req, res) => {
    try {
        const userId = req.userId;

        console.log(`[v64/sync] Loading data for user: ${req.userEmail}`);

        // Load data from MongoDB
        const [projects, tasks, pomodoros] = await Promise.all([
            Project.find({ userId }).select('-_id -__v -userId').lean(),
            Task.find({ userId }).select('-_id -__v -userId').lean(),
            Pomodoro.find({ userId }).select('-_id -__v -userId').lean()
        ]);

        console.log(`[v64/sync] ✅ Loaded: ${projects.length} projects, ${tasks.length} tasks, ${pomodoros.length} pomodoros`);

        // ✅ DATA INTEGRITY & SANITIZATION (Server-Side)
        // Ensure data sent to frontend is crash-proof

        // 1. Ensure Default Project ("Tasks") Exists
        let hasDefault = false;
        const normalizedProjects = projects.map(p => {
            if (p.id === '0' || p.id === 0) hasDefault = true;
            return {
                ...p,
                type: p.type !== undefined && Number(p.type) !== 0 && !isNaN(Number(p.type)) ? Number(p.type) : 1000, // 1000 = regular project
                // ✅ CRITICAL: These fields are REQUIRED for main.js IndexedDB cursor queries
                state: p.state !== undefined ? Number(p.state) : 0, // 0 = visible, 1 = hidden - REQUIRED for state index
                order: p.order !== undefined ? Number(p.order) : 0, // REQUIRED for sorting
                orderingRule: p.orderingRule !== undefined ? Number(p.orderingRule) : 0, // REQUIRED for presets
                sync: p.sync !== undefined ? Number(p.sync) : 1, // 1 = synced
                color: p.color || '#FF6B6B',
                sortOrder: p.sortOrder !== undefined ? p.sortOrder : 0,
                closed: p.closed || false,
                deleted: p.deleted || false,
                // Fix orphaned nesting (move to root if parent missing)
                parentId: (p.parentId && projects.some(parent => parent.id == p.parentId)) ? p.parentId : ''
            };
        });

        // ✅ REMOVED: Phantom project injection
        // Frontend handles default project creation via data-sanitizer.js
        // Server should NOT inject defaults as it creates duplicates

        const projectIds = new Set(normalizedProjects.map(p => String(p.id)));

        // 2. Fix Orphaned Tasks
        const normalizedTasks = tasks.map(t => {
            const pid = String(t.parentId || t.projectId || '');
            const targetPid = projectIds.has(pid) ? pid : '0'; // Fallback to Inbox

            return {
                ...t,
                // Schema match
                projectId: targetPid,
                parentId: targetPid,
                priority: t.priority !== undefined ? t.priority : 0,
                completed: t.completed || false,
                deleted: t.deleted || false,
                sortOrder: t.sortOrder !== undefined ? t.sortOrder : 0,
                // ✅ CRITICAL FIX: Explicitly preserve duration fields with defaults
                estimatePomoNum: t.estimatePomoNum !== undefined ? Number(t.estimatePomoNum) : 0,
                actualPomoNum: t.actualPomoNum !== undefined ? Number(t.actualPomoNum) : 0,
                estimatedPomodoros: t.estimatedPomodoros !== undefined ? Number(t.estimatedPomodoros) : (t.estimatePomoNum || 0),
                actPomodoros: t.actPomodoros !== undefined ? Number(t.actPomodoros) : (t.actualPomoNum || 0),
                pomodoroInterval: t.pomodoroInterval !== undefined && t.pomodoroInterval > 0 ? Number(t.pomodoroInterval) : 1500,
                // Ensure state and sync fields
                state: t.state !== undefined ? Number(t.state) : 0,
                sync: t.sync !== undefined ? Number(t.sync) : 1
            };
        });

        // 3. Normalize Pomodoro Logs (ensure duration fields)
        const normalizedPomodoros = pomodoros.map(p => {
            // Calculate duration if missing but times exist
            let duration = p.duration;
            if ((!duration || duration === 0) && p.startTime && p.endTime && p.endTime > p.startTime) {
                duration = p.endTime - p.startTime;
            }

            return {
                ...p,
                // ✅ CRITICAL FIX: Explicitly preserve duration fields with defaults
                duration: duration !== undefined ? Number(duration) : 0,
                startTime: p.startTime !== undefined ? Number(p.startTime) : 0,
                endTime: p.endTime !== undefined ? Number(p.endTime) : 0,
                // Ensure other fields
                sync: p.sync !== undefined ? Number(p.sync) : 1
            };
        });

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
            pomodoros: normalizedPomodoros, // ✅ Use normalized pomodoros
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

        // Sync Tasks (with normalization)
        if (tasks.length > 0) {
            // ✅ CRITICAL: Normalize tasks before saving to prevent data corruption
            const normalizedTasks = tasks.map(t => ({
                ...t,
                userId: userId,
                // Ensure duration fields are numeric
                estimatePomoNum: t.estimatePomoNum !== undefined ? Number(t.estimatePomoNum) : 0,
                actualPomoNum: t.actualPomoNum !== undefined ? Number(t.actualPomoNum) : 0,
                estimatedPomodoros: t.estimatedPomodoros !== undefined ? Number(t.estimatedPomodoros) : (t.estimatePomoNum || 0),
                actPomodoros: t.actPomodoros !== undefined ? Number(t.actPomodoros) : (t.actualPomoNum || 0),
                pomodoroInterval: t.pomodoroInterval !== undefined && t.pomodoroInterval > 0 ? Number(t.pomodoroInterval) : 1500,
                // Ensure other numeric fields
                state: t.state !== undefined ? Number(t.state) : 0,
                priority: t.priority !== undefined ? Number(t.priority) : 0,
                sortOrder: t.sortOrder !== undefined ? Number(t.sortOrder) : 0
            }));

            const ops = normalizedTasks.map(t => ({
                updateOne: {
                    filter: { id: t.id, userId: userId },
                    update: { $set: t },
                    upsert: true
                }
            }));
            const result = await Task.bulkWrite(ops);
            tasksSynced = result.upsertedCount + result.modifiedCount;
            console.log(`[Sync All] Tasks synced: ${tasksSynced}`);
        }

        // Sync Pomodoro Logs (with normalization)
        if (pomodoroLogs.length > 0) {
            // ✅ CRITICAL: Normalize pomodoros before saving to prevent data corruption
            const normalizedPomodoros = pomodoroLogs.map(p => {
                // Calculate duration if missing or zero but times exist
                let duration = p.duration;
                if ((!duration || duration === 0) && p.startTime && p.endTime && p.endTime > p.startTime) {
                    duration = p.endTime - p.startTime;
                    console.log(`[Sync All] Calculated pomodoro duration: ${duration}ms from times`);
                }

                // ✅ CRITICAL FIX: Only save valid Pomodoro schema fields
                // DO NOT spread ...p as it includes invalid fields like pomodoroInterval
                return {
                    id: p.id,
                    taskId: p.taskId || '',
                    subtaskId: p.subtaskId || '',
                    userId: userId,
                    objType: 'POMODORO',
                    state: p.state !== undefined ? Number(p.state) : 0,
                    sync: p.sync !== undefined ? Number(p.sync) : 0,
                    status: p.status || 'completed',
                    isManual: p.isManual || false,
                    // Time tracking fields
                    duration: duration && duration > 0 ? Number(duration) : 0,
                    startTime: p.startTime !== undefined ? Number(p.startTime) : 0,
                    endTime: p.endTime !== undefined ? Number(p.endTime) : 0,
                    createdAt: p.createdAt || new Date()
                    // ❌ Explicitly NOT including: pomodoroInterval, interval, or any task fields
                };
            });

            const ops = normalizedPomodoros.map(l => ({
                updateOne: {
                    filter: { id: l.id, userId: userId },
                    update: { $set: l },
                    upsert: true
                }
            }));
            const result = await Pomodoro.bulkWrite(ops);
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
// Logout endpoint - properly destroy session
app.all('/v63/user/logout', async (req, res) => {
    try {
        console.log('[Logout] User logging out:', req.session?.user?.email || 'unknown');

        // Destroy session
        if (req.session) {
            await new Promise((resolve, reject) => {
                req.session.destroy((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        // Clear all authentication cookies
        const cookiesToClear = ['ACCT', 'NAME', 'UID', 'JSESSIONID', 'secondbrain.sid', 'secondbrain.token'];
        cookiesToClear.forEach(name => {
            res.clearCookie(name, { path: '/' });
        });

        console.log('[Logout] ✅ Session destroyed and cookies cleared');
        res.json({ status: 0, success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('[Logout] ❌ Error:', error);
        res.json({ status: 1, success: false, message: 'Logout failed: ' + error.message });
    }
});
app.get('/v65/access', (req, res) => res.json({ success: true }));
app.get('/v60/property', (req, res) => res.json({ success: true, properties: {} }));
app.get('/statusv60/property', (req, res) => res.json({ success: true, properties: {} }));
app.get('/v62/user/point', (req, res) => res.json({ success: true, point: 0 }));
app.all('/v63/exception-report', (req, res) => res.json({ status: 0, success: true }));

// Health check endpoint (for keep-alive pings)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

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

// Import keep-alive service
const { startKeepAlive } = require('./services/keepAlive');

app.listen(PORT, () => {
    console.log(`✅ Server: http://localhost:${PORT}`);
    console.log(`✅ Dual-Mode Auth: Cookie + Token`);

    // Start keep-alive service (prevents Render free tier from sleeping)
    startKeepAlive();
});
