const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
require('dotenv').config();

const connectDB = require('./db');

const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (origin === 'null') return callback(null, true);
        return callback(null, true);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ✅ Import routes
const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync'); // NEW sync routes
const legacyRoutes = require('./routes/legacy-routes'); // NEW: Bulletproof Legacy Routes

// ✅ Use routes - Mount legacy routes FIRST to catch specific paths
app.use('/', legacyRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes); // NEW sync endpoint

// Create a router for v65 legacy routes
const v65Router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';

// v65 Login
v65Router.post('/login', async (req, res) => {
    console.log('[Backend] v65 Login request received:', req.body);
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            console.log('[Backend] User not found:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.log('[Backend] Password mismatch for:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        console.log('[Backend] Login successful for:', email);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name || user.username || email.split('@')[0]
            }
        });
    } catch (error) {
        console.error('[Backend] Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// v65 Register
v65Router.post('/register', async (req, res) => {
    console.log('[Backend] v65 Register request received:', req.body);
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }
        let user = await User.findOne({ email });
        if (user) {
            console.log('[Backend] User already exists:', email);
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Generate name if missing
        const displayName = name || email.split('@')[0];

        // User model hashes password automatically via pre-save hook
        user = new User({
            email,
            password,
            username: displayName,
            name: displayName
        });
        await user.save();
        console.log('[Backend] User created:', email);
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token: token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('[Backend] Register error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// v65 Access
v65Router.get('/access', (req, res) => {
    res.json({ success: true, message: 'Server accessible', timestamp: new Date().toISOString() });
});

app.use('/v65', v65Router);

// Legacy API Stubs (handled by legacy-shim mostly, but keeping these if not colliding)
// Removing duplicate stubs handled by legacy-shim to avoid confusion, 
// or keeping them if they are different versions not covered.
// backend/routes/legacy-shim covers v64 config, v64 sync, v61 groups, v62 point.
// Below are: v60 property, v61 rank, v61 group list.
// Keeping them is fine.
app.use('/v60/property', (req, res) => res.json({ success: true, properties: {} }));
app.use('/v61/rank', (req, res) => res.json({ success: true, rank: [] }));
// app.use('/v61/group', (req, res) => res.json({ success: true, list: [] })); // Moved to shim as /v61/user/groups? No, check shim.
// Shim has /v61/user/groups. This is /v61/group.
app.use('/v61/group', (req, res) => res.json({ success: true, list: [] }));

// WebSocket
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    ws.on('message', async (message) => {
        console.log('received: %s', message);
        ws.send(JSON.stringify({ type: 'ack', message: 'Received' }));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
