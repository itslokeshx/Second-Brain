```
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';

// --- AUTH HANDLERS ---

router.post('/v63/user/login', async (req, res) => {
    // DEBUG LOGGING
    console.log('[Legacy Login] Body received:', JSON.stringify(req.body, null, 2));

    try {
        // Handle "email" or "username" field (legacy app might send either)
        const email = req.body.email || req.body.username;
        const password = req.body.password;

        if (!email || !password) {
            console.log('[Legacy Login] Missing credentials');
            return res.status(400).json({ success: false, message: 'Missing email or password' });
        }

        // Find user
        const user = await User.findOne({ email: email });
        
        if (!user) {
            console.log('[Legacy Login] User not found:', email);
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Check Password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.log('[Legacy Login] Password invalid for:', email);
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // Generate Token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

        // Force a valid name to fix "Symbol Language" bug
        const safeName = user.name || user.username || email.split('@')[0] || 'MyUser';

        console.log('[Legacy Login] Success:', email);
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
    console.log('[Legacy Register] Body:', req.body);
    try {
        const { email, password } = req.body;
        // Fix empty name
        const name = req.body.name || email.split('@')[0] || 'User';

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ success: false, message: 'User exists' });

        user = await User.create({ email, password, name, username: name });
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            success: true,
            token: token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- STUBS (Prevent 404 Crashes) ---
router.get('/v64/user/config', (req, res) => res.json({ success: true, config: {} }));
router.all('/v64/sync', (req, res) => res.json({ success: true, timestamp: Date.now() }));
router.get('/v61/user/groups', (req, res) => res.json({ success: true, list: [] }));
router.get('/v61/group/more', (req, res) => res.json({ success: true }));
router.get('/v62/user/point', (req, res) => res.json({ success: true, points: 0 }));
router.all('/v63/exception-report', (req, res) => res.json({ success: true }));
router.all('/v63/user', (req, res) => res.json({ success: true }));

module.exports = router;
```
