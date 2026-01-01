const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
    generateJSessionId,
    persistSession,
    getSession,
    attachSessionCookie
} = require('../utils/sessionStore');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PROJECT HELPERS - Used to ensure hydration-critical projects exist
// ═══════════════════════════════════════════════════════════════════════════

function getSystemProjectName(id) {
    const names = {
        'today': 'Today',
        'tomorrow': 'Tomorrow',
        'inbox': 'Inbox',
        '0': 'Tasks',
        'all': 'All',
        'completed': 'Completed',
        'calendar': 'Calendar',
        'search': 'Search',
        'week': 'This Week',
        'planned': 'Planned',
        'someday': 'Someday',
        'overdue': 'Overdue',
        'next7days': 'Next 7 Days',
        'default': 'Default',
        'myday': "Today's Tasks",
        'history': 'History',
        'upcoming': 'Upcoming',
        'focus': 'Focus'
    };
    return names[id] || id;
}

function getSystemProjectType(id) {
    // CORRECT type values from main.js:
    // l.project = 1000, l.today = 4000, l.tomorrow = 4001, etc.
    const types = {
        'today': 4000,      // l.today = 4e3
        'tomorrow': 4001,   // l.tomorrow
        'next7days': 4004,  // l.next7Days
        'someday': 4003,    // l.someday
        'completed': 7003,  // l.history
        'history': 7003,    // l.history
        'all': 7000,        // l.all = 7e3
        'calendar': 7001,   // l.calendar
        'overdue': 4006,    // l.overdue
        'search': 7002,     // l.search
        'week': 4007,       // l.thisWeek
        'planned': 4002,    // l.scheduled
        'upcoming': 4002,   // l.scheduled
        'myday': 4000,      // Same as today
        'inbox': 1000,      // l.project = 1e3
        '0': 1000,          // Regular project
        'default': 1000,    // Regular project
        'focus': 1000       // Regular project
    };
    return types[id] || 1000;  // Default to regular project type
}

// Normalize auth/session payloads to the exact fields the legacy frontend reads
const buildLegacyPayload = (user, jsessionId, overrides = {}) => {
    const now = Date.now();
    const uid = user ? user._id.toString() : (overrides.uid || overrides.pid || '');
    const acct = user ? user.email : (overrides.acct || '');
    const name = user ? user.name : (overrides.name || (acct ? acct.split('@')[0] : ''));

    const base = {
        status: 0,
        success: true,
        message: 'OK',
        acct,
        pid: uid,
        uid,
        name,
        jsessionId: jsessionId || overrides.jsessionId || '',
        expiredDate: now + (30 * 24 * 60 * 60 * 1000),
        portrait: '',
        avatarTimestamp: now,
        config: overrides.config || {},
        timestamp: overrides.timestamp || now,
        server_now: overrides.server_now || now,
        update_time: overrides.update_time || now,
        projects: overrides.projects || [],
        tasks: overrides.tasks || [],
        subtasks: overrides.subtasks || [],
        pomodoros: overrides.pomodoros || [],
        schedules: overrides.schedules || [],
        project_member: overrides.project_member || [],
        list: overrides.list || []
    };

    return { ...base, ...overrides };
};

// Extract user identity from bearer token, body, or query params
async function resolveUser(req) {
    // 0) Session cookie/header/body jsessionId
    const candidateJSession = req.body?.jsessionId || req.headers['x-jsessionid'] || (req.cookies && req.cookies.JSESSIONID);
    if (candidateJSession) {
        const session = getSession(candidateJSession);
        if (session) {
            const user = await User.findById(session.uid);
            if (user) return { user, jsessionId: candidateJSession };
        }
    }

    // 1) Authorization: Bearer <jwt>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const raw = authHeader.slice(7);
        try {
            const decoded = jwt.verify(raw, JWT_SECRET);
            const user = await User.findById(decoded.userId || decoded.id);
            if (user) return { user, jsessionId: '' };
        } catch (e) {
            // fall through
        }
    }

    // 2) Legacy fields in body/query
    const body = req.body || {};
    const query = req.query || {};
    const acct = body.acct || query.acct;
    const uid = body.uid || body.pid || query.uid || query.pid;
    const name = body.name || query.name;
    const jsessionId = body.jsessionId || query.jsessionId;

    if (acct) {
        const user = await User.findOne({ email: acct });
        if (user) return { user, jsessionId };
    }
    if (uid) {
        const user = await User.findById(uid);
        if (user) return { user, jsessionId };
    }

    // 3) Fallback to provided identity
    return {
        user: acct || uid ? {
            _id: uid || acct,
            email: acct || '',
            name: name || (acct ? acct.split('@')[0] : '')
        } : null,
        jsessionId: jsessionId || ''
    };
}

// --- AUTH HANDLERS ---

router.post('/v63/user/login', async (req, res) => {
    try {
        // Legacy frontend uses 'account', modern uses 'email'
        const email = req.body.email || req.body.username || req.body.account;
        const password = req.body.password || req.body.pwd;

        if (!email || !password) {
            // Legacy expects status -1 for errors
            return res.json({ status: -1, errMsg: 'Missing credentials' });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.json({ status: -1, errMsg: 'Invalid credentials' });
        }

        const jsessionId = generateJSessionId();
        persistSession(user, jsessionId);
        attachSessionCookie(res, jsessionId);

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

        res.json(buildLegacyPayload(user, jsessionId, {
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        }));
    } catch (err) {
        console.error("Login Error", err);
        res.json({ status: -1, errMsg: err.message });
    }
});

router.post('/v63/user/register', async (req, res) => {
    try {
        const email = req.body.email || req.body.username || req.body.account;
        const password = req.body.password || req.body.pwd;

        if (!email || !password) return res.json({ status: -1, errMsg: 'Missing info' });

        let user = await User.findOne({ email });
        if (user) return res.json({ status: -1, errMsg: 'User exists' });

        const name = req.body.name || email.split('@')[0];
        user = await User.create({ email, password, name, username: name });
        const jsessionId = generateJSessionId();
        persistSession(user, jsessionId);
        attachSessionCookie(res, jsessionId);

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

        res.json(buildLegacyPayload(user, jsessionId, {
            token,
            user: { id: user._id, name, email }
        }));
    } catch (err) {
        res.json({ status: -1, errMsg: err.message });
    }
});

router.post('/v63/user/logout', (req, res) => {
    res.json({ status: 0, success: true });
});

// --- CRITICAL SYNC FIX ---
router.all('/v64/sync', async (req, res) => {
    console.log(`[Legacy Sync] Request received from ${req.ip}`);

    // Legacy app uses Unix Timestamp in SECONDS
    const now = Date.now(); // milliseconds expected by legacy UI for last-sync math
    const cookieHeader = req.headers.cookie || '';

    // ✅ FIX: Check multiple cookie sources for session ID
    const jsessionIdMatch = cookieHeader.match(/JSESSIONID=([^;]+)/);
    const tokenMatch = cookieHeader.match(/secondbrain\.token=([^;]+)/);

    let jsessionId = req.body?.jsessionId || req.headers['x-jsessionid'] || (req.cookies && req.cookies.JSESSIONID);

    // If JSESSIONID is literally "undefined", try secondbrain.token
    if (!jsessionId || jsessionId === 'undefined') {
        jsessionId = (req.cookies && req.cookies['secondbrain.token']) || (tokenMatch ? tokenMatch[1] : null);
    }

    // Last resort: try regex matches
    if (!jsessionId || jsessionId === 'undefined') {
        jsessionId = (jsessionIdMatch ? jsessionIdMatch[1] : null) || (tokenMatch ? tokenMatch[1] : null);
    }

    console.log('[Legacy Sync] Session ID:', jsessionId);

    const session = getSession(jsessionId);
    if (!session) {
        console.log('[Legacy Sync] ❌ No valid session');
        return res.json({ status: 1, success: false });
    }

    const user = await User.findById(session.uid);
    if (!user) {
        console.log('[Legacy Sync] ❌ User not found');
        return res.json({ status: 1, success: false });
    }

    // ✅ LOAD ACTUAL DATA FROM MONGODB
    const Project = require('../models/Project');
    const Task = require('../models/Task');
    const Pomodoro = require('../models/Pomodoro');

    const [projects, tasks, pomodoros] = await Promise.all([
        Project.find({ userId: user._id }).select('-_id -__v -userId').lean(),
        Task.find({ userId: user._id }).select('-_id -__v -userId').lean(),
        Pomodoro.find({ userId: user._id }).select('-_id -__v -userId').lean()
    ]);

    console.log(`[Legacy Sync] ✅ Loaded: ${projects.length} projects, ${tasks.length} tasks, ${pomodoros.length} pomodoros`);

    // ✅ HYDRATION PROTECTION: Ensure system projects are always present
    // Without these, frontend React gate at main.js:117550 blocks render
    const SYSTEM_PROJECT_IDS = ['today', 'tomorrow', 'inbox', '0', 'all', 'completed',
        'calendar', 'search', 'week', 'planned', 'someday', 'overdue', 'next7days',
        'default', 'myday', 'history', 'upcoming', 'focus'];

    const existingIds = new Set(projects.map(p => String(p.id)));

    const systemProjectsToAdd = SYSTEM_PROJECT_IDS
        .filter(id => !existingIds.has(id))
        .map(id => ({
            id,
            name: getSystemProjectName(id),
            type: getSystemProjectType(id),
            isSystem: true,
            isPreset: true,
            hidden: false,
            state: 0,
            sync: 1,
            order: 0,
            color: '#4A90D9',
            parentId: '',
            createdDate: now,
            modifiedDate: now
        }));

    const allProjects = [...projects, ...systemProjectsToAdd];
    if (systemProjectsToAdd.length > 0) {
        console.log(`[Legacy Sync] 🛡️ Added ${systemProjectsToAdd.length} missing system projects`);
    }

    attachSessionCookie(res, jsessionId);

    const response = buildLegacyPayload(user, jsessionId, {
        timestamp: now,
        server_now: now,
        update_time: now,
        project_member: [],
        list: [],
        projects: allProjects || [],
        tasks: tasks || [],
        subtasks: [],
        pomodoros: pomodoros || [],
        schedules: []
    });

    console.log('[Legacy Sync] Sending response with data');
    res.json(response);
});

// --- STUBS (Prevent 404 Crashes) ---
router.get('/v64/user/config', async (req, res) => {
    const cookieHeader = req.headers.cookie || '';

    // ✅ FIX: Check multiple cookie sources
    const jsessionIdMatch = cookieHeader.match(/JSESSIONID=([^;]+)/);
    const tokenMatch = cookieHeader.match(/secondbrain\.token=([^;]+)/);

    let jsessionId = (req.cookies && req.cookies.JSESSIONID);

    // If JSESSIONID is "undefined", try secondbrain.token
    if (!jsessionId || jsessionId === 'undefined') {
        jsessionId = (req.cookies && req.cookies['secondbrain.token']) || (tokenMatch ? tokenMatch[1] : null);
    }

    // Last resort: regex
    if (!jsessionId || jsessionId === 'undefined') {
        jsessionId = (jsessionIdMatch ? jsessionIdMatch[1] : null) || (tokenMatch ? tokenMatch[1] : null);
    }

    const session = getSession(jsessionId);
    if (!session) {
        return res.json({ status: 1, success: false });
    }

    // ✅ LOAD ACTUAL USER FROM MONGODB
    const user = await User.findById(session.uid);

    attachSessionCookie(res, jsessionId);

    return res.json({
        status: 0,
        success: true,
        uid: session.uid,
        pid: session.uid,
        acct: user ? user.email : session.email,
        name: user ? user.name : (session.name || session.email),
        jsessionId,
        user: user ? {
            id: user._id,
            email: user.email,
            name: user.name
        } : null,
        config: {
            theme: 'dark',
            language: 'en',
            autoSync: true
        }
    });
});
router.get('/v61/user/groups', (req, res) => res.json({ status: 0, success: true, list: [] }));
router.get('/v61/group/more', (req, res) => res.json({ status: 0, success: true }));
router.get('/v62/user/point', (req, res) => res.json({ status: 0, success: true, points: 0 }));
router.all('/v63/exception-report', (req, res) => res.json({ status: 0, success: true }));
router.all('/v63/user', (req, res) => res.json({ status: 0, success: true }));

module.exports = router;
