const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';

// Helper to handle both 'account' and 'email' fields
const getCredentials = (body) => {
    return {
        email: body.email || body.username || body.account,
        password: body.password || body.pwd
    };
};

// --- AUTH ---

router.post('/v63/user/login', async (req, res) => {
    try {
        const { email, password } = getCredentials(req.body);
        if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });

        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
        const safeName = user.name || user.username || email.split('@')[0];

        res.json({
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
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/v63/user/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out' });
});

router.post('/v63/user/register', async (req, res) => {
    try {
        const { email, password } = getCredentials(req.body);
        if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ success: false, message: 'User exists' });

        const name = req.body.name || email.split('@')[0];
        user = await User.create({ email, password, name, username: name });
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            success: true,
            token: token,
            user: { id: user._id, name, email }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- SYNC & STUBS (Fixing the Infinite Spinner) ---

// The legacy app expects this EXACT structure to stop spinning
router.all('/v64/sync', (req, res) => {
    res.json({
        success: true,
        server_now: Date.now(),
        update_time: Date.now(),
        list: []
    });
});

router.get('/v64/user/config', (req, res) => res.json({ success: true, config: {} }));
router.get('/v61/user/groups', (req, res) => res.json({ success: true, list: [] }));
router.get('/v61/group/more', (req, res) => res.json({ success: true }));
router.get('/v62/user/point', (req, res) => res.json({ success: true, points: 0 }));
router.all('/v63/exception-report', (req, res) => res.json({ success: true }));
router.all('/v63/user', (req, res) => res.json({ success: true }));

module.exports = router;
