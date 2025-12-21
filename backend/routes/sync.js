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

// ✅ SYNC ALL DATA (Update User Document)
router.post('/all', authMiddleware, async (req, res) => {
    console.log('[Sync] Sync requested for user:', req.userId);

    try {
        const { projects, tasks, pomodoroLogs, settings } = req.body;
        const userId = req.userId;

        // Construct update object
        const updateData = {
            lastSyncTime: new Date()
        };

        if (projects) updateData.projects = projects;
        if (tasks) updateData.tasks = tasks;
        if (pomodoroLogs) updateData.pomodoroLogs = pomodoroLogs;
        if (settings) updateData.settings = settings;

        // Update User document directly
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, upsert: true } // Return updated doc
        ).lean();

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log('[Sync] User document updated successfully');

        res.json({
            success: true,
            message: 'Sync completed',
            projectsSynced: projects ? projects.length : 0,
            tasksSynced: tasks ? tasks.length : 0,
            logsSynced: pomodoroLogs ? pomodoroLogs.length : 0,
            serverData: {
                projects: updatedUser.projects || [],
                tasks: updatedUser.tasks || [],
                pomodoroLogs: updatedUser.pomodoroLogs || [],
                settings: updatedUser.settings || {}
            }
        });

    } catch (error) {
        console.error('[Sync] Error:', error);
        res.status(500).json({ success: false, message: 'Sync failed: ' + error.message });
    }
});

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

module.exports = router;
