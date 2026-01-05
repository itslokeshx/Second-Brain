const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';

router.post('/register', async (req, res) => {
    try {
        const { email, account, password, name } = req.body;
        const userEmail = email || account;

        if (!userEmail || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        let user = await User.findOne({ email: userEmail });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        user = new User({
            email: userEmail,
            password,
            name: name || userEmail.split('@')[0]
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

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


router.post('/login', async (req, res) => {
    try {
        const { email, account, password } = req.body;
        const userEmail = email || account;

        if (!userEmail || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

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
