const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';

// --- HELPER: Extract Credentials ---
const getCredentials = (body) => {
    // Legacy app uses 'account', standard uses 'email' or 'username'
    const email = body.email || body.username || body.account;
    const password = body.password || body.pwd;
    return { email, password };
};

// --- AUTH HANDLERS ---

router.post('/v63/user/login', async (req, res) => {
    console.log('[Legacy Login] Received Body:', JSON.stringify(req.body));

    try {
        const { email, password } = getCredentials(req.body);

        if (!email || !password) {
            console.warn('[Legacy Login] Missing credentials. Body:', req.body);
            return res.status(400).json({ success: false, message: 'Missing account or password' });
        }

        // Find user by email (which stores the account name)
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

        // Ensure we send back a valid name/username to prevent frontend display bugs
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
        console.error('[Legacy Login] Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/v63/user/register', async (req, res) => {
    console.log('[Legacy Register] Received Body:', JSON.stringify(req.body));

    try {
        const { email, password } = getCredentials(req.body);

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Missing account or password' });
        }

        // Generate a name if missing
        const name = req.body.name || email.split('@')[0] || 'User';

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Save 'account' into 'email' field
        user = await User.create({
            email: email,
            password: password,
            name: name,
            username: name
        });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            success: true,
            token: token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error('[Legacy Register] Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- STUBS (Prevent 404 Crashes) ---
// These keep the legacy frontend happy so it doesn't crash on startup
router.get('/v64/user/config', (req, res) => res.json({ success: true, config: {} }));
router.all('/v64/sync', (req, res) => res.json({ success: true, timestamp: Date.now() }));
router.get('/v61/user/groups', (req, res) => res.json({ success: true, list: [] }));
router.get('/v61/group/more', (req, res) => res.json({ success: true }));
router.get('/v62/user/point', (req, res) => res.json({ success: true, points: 0 }));
router.all('/v63/exception-report', (req, res) => res.json({ success: true }));
router.all('/v63/user', (req, res) => res.json({ success: true }));

module.exports = router;
