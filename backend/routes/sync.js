const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ Auth Middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: 'No authentication token provided' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-please-change');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// ============================================================================
// GRANULAR SYNC ROUTES (Matches Frontend sync-service.js)
// ============================================================================

// 1. Sync Projects
router.post('/projects', authMiddleware, async (req, res) => {
    console.log('[Sync] Projects sync requested');
    try {
        const { projects } = req.body;
        // Update the user's projects array
        await User.findByIdAndUpdate(
            req.userId,
            {
                $set: { projects: projects || [] },
                $currentDate: { lastSyncTime: true }
            },
            { new: true, upsert: true }
        );
        res.json({ success: true, syncTime: new Date() });
    } catch (error) {
        console.error('[Sync] Projects failed:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Sync Tasks
router.post('/tasks', authMiddleware, async (req, res) => {
    console.log('[Sync] Tasks sync requested');
    try {
        const { tasks } = req.body;
        await User.findByIdAndUpdate(
            req.userId,
            {
                $set: { tasks: tasks || [] },
                $currentDate: { lastSyncTime: true }
            },
            { new: true, upsert: true }
        );
        res.json({ success: true, syncTime: new Date() });
    } catch (error) {
        console.error('[Sync] Tasks failed:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Sync Logs (Pomodoros)
// Frontend sends to /api/sync/logs or /api/sync/pomodoroLogs? 
// User prompt says: "/api/sync/logs" in Diagnosis, but also "logs (pomodoroLogs)" in example. 
// Standard apps often use /logs. I will map /logs to pomodoroLogs.
router.post('/logs', authMiddleware, async (req, res) => {
    console.log('[Sync] Logs sync requested');
    try {
        const { logs, pomodoroLogs } = req.body;
        const dataToSave = logs || pomodoroLogs || [];

        await User.findByIdAndUpdate(
            req.userId,
            {
                $set: { pomodoroLogs: dataToSave },
                $currentDate: { lastSyncTime: true }
            },
            { new: true, upsert: true }
        );
        res.json({ success: true, syncTime: new Date() });
    } catch (error) {
        console.error('[Sync] Logs failed:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Sync Settings
router.post('/settings', authMiddleware, async (req, res) => {
    console.log('[Sync] Settings sync requested');
    try {
        const { settings } = req.body;
        // Ensure settings object has correct structure/defaults if needed, or trust frontend
        await User.findByIdAndUpdate(
            req.userId,
            {
                $set: { settings: settings || {} },
                $currentDate: { lastSyncTime: true }
            },
            { new: true, upsert: true }
        );
        res.json({ success: true, syncTime: new Date() });
    } catch (error) {
        console.error('[Sync] Settings failed:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================================================
// SHARED / LEGACY ROUTES
// ============================================================================

// ✅ GET ALL USER DATA (Initial load)
router.get('/load', authMiddleware, async (req, res) => {
    console.log('[Sync] Loading data for user:', req.userId);
    try {
        const user = await User.findById(req.userId).lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                projects: user.projects || [],
                tasks: user.tasks || [],
                pomodoroLogs: user.pomodoroLogs || [],
                settings: user.settings || {},
                user: {
                    email: user.email,
                    name: user.username || user.name,
                    lastSyncTime: user.lastSyncTime
                }
            }
        });
    } catch (error) {
        console.error('[Sync] Load error:', error);
        res.status(500).json({ success: false, message: 'Failed to load data: ' + error.message });
    }
});

// Fallback for /all (just in case SessionManager still calls it, 
// though sync-service.js seems to be the active one now according to user logs)
router.post('/all', authMiddleware, async (req, res) => {
    console.log('[Sync] Full sync (fallback) requested');
    try {
        const { projects, tasks, pomodoroLogs, settings } = req.body;

        let update = { lastSyncTime: new Date() };
        if (projects) update.projects = projects;
        if (tasks) update.tasks = tasks;
        if (pomodoroLogs) update.pomodoroLogs = pomodoroLogs;
        if (settings) update.settings = settings;

        await User.findByIdAndUpdate(
            req.userId,
            { $set: update },
            { new: true, upsert: true }
        );
        res.json({ success: true, message: 'Full sync completed' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
