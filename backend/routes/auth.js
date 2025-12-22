const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { email, account, password, name } = req.body;
        // Support both 'email' and 'account' fields for compatibility
        const userEmail = email || account;

        if (!userEmail || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Check availability
        let user = await User.findOne({ email: userEmail });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create user
        user = new User({
            email: userEmail,
            password, // Mongoose pre-save hook will hash this
            name: name || userEmail.split('@')[0]
        });

        await user.save();

        // Generate Token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Return success response
        res.status(201).json({
            success: true,
            code: 200,
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });

    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, account, password } = req.body;
        const userEmail = email || account;

        if (!userEmail || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Find user
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        res.json({
            success: true,
            code: 200,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.username
            }
        });

    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

module.exports = router;
