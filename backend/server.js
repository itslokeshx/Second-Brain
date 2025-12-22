const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware - Fix CORS for file:// protocol
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like file://) or from localhost
        if (!origin || origin === 'null') return callback(null, true);
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ✅ Import models
const User = require('./models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';

// ✅ REGISTER ENDPOINT
app.post('/v63/user/register', async (req, res) => {
    try {
        let { email, password, name, username, account } = req.body;

        // Support 'account' field (what frontend sends)
        if (!email && account) email = account;
        if (!name && username) name = username;

        // Validation
        if (!email || !password) {
            console.log('[Register] Missing email or password');
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Clean name
        if (!name || name.trim() === '') {
            name = email.split('@')[0];
        }

        console.log('[Register] Attempting registration:', email, name);

        // Check if user exists
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create user (password will be hashed by pre-save hook)
        user = new User({
            email: email.toLowerCase(),
            password: password,
            name: name
        });

        await user.save();
        console.log('[Register] User created:', user.email);

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            status: 0, // Legacy compatibility
            message: 'Registration successful',
            token: token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error('[Register] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ✅ LOGIN ENDPOINT
app.post('/v63/user/login', async (req, res) => {
    try {
        // ✅ Debug logging
        console.log('[Login] ===== REQUEST DEBUG =====');
        console.log('[Login] Headers:', JSON.stringify(req.headers, null, 2));
        console.log('[Login] Body:', JSON.stringify(req.body, null, 2));
        console.log('[Login] Body type:', typeof req.body);
        console.log('[Login] Body keys:', Object.keys(req.body || {}));
        console.log('[Login] =========================');

        const { email, password, username, acct } = req.body;

        // Support multiple field names (email, username, acct)
        const loginEmail = email || username || acct;

        console.log('[Login] Attempting login:', loginEmail);

        // Validate
        if (!loginEmail || !password) {
            console.log('[Login] Missing credentials - email:', loginEmail, 'password:', !!password);
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({ email: loginEmail.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        console.log('[Login] Success for:', user.email, 'Name:', user.name);

        res.status(200).json({
            success: true,
            status: 0, // Legacy compatibility
            message: 'Login successful',
            token: token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name // ✅ Clean string, no encoding
            }
        });

    } catch (error) {
        console.error('[Login] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ✅ Import and use sync routes
const syncRoutes = require('./routes/sync');
app.use('/api/sync', syncRoutes);

// ✅ Import legacy routes for compatibility
const legacyRoutes = require('./routes/legacy-routes');
app.use('/', legacyRoutes);

// ✅ Add missing legacy endpoint stubs
app.get('/v65/access', (req, res) => {
    res.json({ success: true, message: 'Server accessible', timestamp: new Date().toISOString() });
});

app.get('/v60/property', (req, res) => {
    res.json({ success: true, properties: {} });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/second-brain';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB Connected');
        console.log('✅ Database:', mongoose.connection.db.databaseName);
        console.log('✅ Collections will be created on first use:');
        console.log('   - users (user info only)');
        console.log('   - projects (separate collection)');
        console.log('   - tasks (separate collection)');
        console.log('   - pomodorologs (separate collection)');
        console.log('   - settings (separate collection)');
    })
    .catch(err => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Endpoints:`);
    console.log(`   POST /v63/user/register`);
    console.log(`   POST /v63/user/login`);
    console.log(`   POST /api/sync/all`);
    console.log(`   GET  /api/sync/load`);
});
