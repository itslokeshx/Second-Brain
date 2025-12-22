const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';

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

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

        // Ensure name is clean (no symbols)
        const safeName = user.name || email.split('@')[0];

        // CRITICAL: status: 0 is required for legacy success
        res.json({
            status: 0,
            success: true,
            token: token,
            user: {
                id: user._id,
                email: user.email,
                name: safeName,
                username: safeName,
                setting: user.settings || {}
            }
        });
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
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            status: 0,
            success: true,
            token: token,
            user: { id: user._id, name, email }
        });
    } catch (err) {
        res.json({ status: -1, errMsg: err.message });
    }
});

router.post('/v63/user/logout', (req, res) => {
    res.json({ status: 0, success: true });
});

// --- CRITICAL SYNC FIX ---
router.all('/v64/sync', (req, res) => {
    console.log(`[Legacy Sync] Request received from ${req.ip}`);

    // Legacy app uses Unix Timestamp in SECONDS
    const now = Math.floor(Date.now() / 1000);

    const response = {
        status: 0,
        success: true,
        timestamp: now,
        server_now: now,
        update_time: now, // Some versions look for this

        // REQUIRED: Empty arrays to prevent iteration crashes
        projects: [],
        tasks: [],
        subtasks: [],
        pomodoros: [],
        project_member: [],
        list: []
    };

    console.log('[Legacy Sync] Sending response:', JSON.stringify(response));
    res.json(response);
});

// --- STUBS (Prevent 404 Crashes) ---
router.get('/v64/user/config', (req, res) => res.json({ status: 0, success: true, config: {} }));
router.get('/v61/user/groups', (req, res) => res.json({ status: 0, success: true, list: [] }));
router.get('/v61/group/more', (req, res) => res.json({ status: 0, success: true }));
router.get('/v62/user/point', (req, res) => res.json({ status: 0, success: true, points: 0 }));
router.all('/v63/exception-report', (req, res) => res.json({ status: 0, success: true }));
router.all('/v63/user', (req, res) => res.json({ status: 0, success: true }));

module.exports = router;
