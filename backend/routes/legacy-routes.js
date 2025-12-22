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
    const cookieMatch = cookieHeader.match(/JSESSIONID=([^;]+)/);
    const jsessionId = req.body?.jsessionId || req.headers['x-jsessionid'] || (req.cookies && req.cookies.JSESSIONID) || (cookieMatch ? cookieMatch[1] : null);

    const session = getSession(jsessionId);
    if (!session) {
        return res.json({ status: 1, success: false });
    }

    const user = await User.findById(session.uid);

    attachSessionCookie(res, jsessionId);

    const response = buildLegacyPayload(user, jsessionId, {
        acct: session.email,
        name: session.name || (user && user.name),
        timestamp: now,
        server_now: now,
        update_time: now,
        project_member: [],
        list: [],
        projects: [],
        tasks: [],
        subtasks: [],
        pomodoros: [],
        schedules: []
    });

    console.log('[Legacy Sync] Sending response:', JSON.stringify(response));
    res.json(response);
});

// --- STUBS (Prevent 404 Crashes) ---
router.get('/v64/user/config', async (req, res) => {
    const cookieHeader = req.headers.cookie || '';
    const cookieMatch = cookieHeader.match(/JSESSIONID=([^;]+)/);
    const jsessionId = (req.cookies && req.cookies.JSESSIONID) || (cookieMatch ? cookieMatch[1] : null);

    if (!jsessionId || !getSession(jsessionId)) {
        return res.json({ status: 1, success: false });
    }

    const session = getSession(jsessionId);
    attachSessionCookie(res, jsessionId);

    return res.json({
        status: 0,
        success: true,
        uid: session.uid,
        pid: session.uid,
        acct: session.email,
        name: session.name || session.email,
        jsessionId,
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
