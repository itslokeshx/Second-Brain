const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Pomodoro = require('../models/Pomodoro');
const Settings = require('../models/Settings');

// ✅ Auth Middleware
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-please-change');

        req.userId = decoded.userId;
        console.log('[Auth] User authenticated:', req.userId);
        next();
    } catch (error) {
        console.error('[Auth] Error:', error.message);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// ✅ COMPLETE SYNC ENDPOINT
router.post('/all', authMiddleware, async (req, res) => {
    console.log('[Sync All] Request from user:', req.userId);
    console.log('[Sync All] Body keys:', Object.keys(req.body));

    try {
        const { projects, tasks, pomodoroLogs, settings } = req.body;
        const userId = req.userId;

        let results = {
            success: true,
            message: 'Sync completed',
            projectsSynced: 0,
            tasksSynced: 0,
            logsSynced: 0,
            settingsSynced: false,
            timestamp: new Date().toISOString()
        };

        // ✅ 1. Sync Projects to SEPARATE collection
        if (projects && Array.isArray(projects) && projects.length > 0) {
            console.log(`[Sync All] Syncing ${projects.length} projects...`);

            for (const project of projects) {
                await Project.findOneAndUpdate(
                    { userId, id: project.id },
                    {
                        userId,
                        ...project,
                        updatedAt: new Date()
                    },
                    { upsert: true, new: true }
                );
                results.projectsSynced++;
            }
            console.log(`[Sync All] ✅ ${results.projectsSynced} projects synced`);
        }

        // ✅ 2. Sync Tasks to SEPARATE collection
        if (tasks && Array.isArray(tasks) && tasks.length > 0) {
            console.log(`[Sync All] Syncing ${tasks.length} tasks...`);

            for (const task of tasks) {
                // ✅ Log duration fields for debugging
                if (task.estimatePomoNum !== undefined || task.actualPomoNum !== undefined) {
                    console.log(`[Sync All] Task "${task.name}" duration fields:`, {
                        estimatePomoNum: task.estimatePomoNum,
                        actualPomoNum: task.actualPomoNum,
                        estimatedPomodoros: task.estimatedPomodoros,
                        actPomodoros: task.actPomodoros,
                        pomodoroInterval: task.pomodoroInterval
                    });
                }

                await Task.findOneAndUpdate(
                    { userId, id: task.id },
                    {
                        userId,
                        ...task,
                        updatedAt: new Date()
                    },
                    { upsert: true, new: true }
                );
                results.tasksSynced++;
            }
            console.log(`[Sync All] ✅ ${results.tasksSynced} tasks synced`);
        }

        // ✅ 3. Sync Pomodoro Logs to SEPARATE collection
        if (pomodoroLogs && Array.isArray(pomodoroLogs) && pomodoroLogs.length > 0) {
            console.log(`[Sync All] Syncing ${pomodoroLogs.length} logs...`);

            for (const log of pomodoroLogs) {
                // ✅ Log duration fields for debugging
                if (log.duration !== undefined || log.startTime !== undefined || log.endTime !== undefined) {
                    console.log(`[Sync All] Pomodoro log duration fields:`, {
                        id: log.id,
                        duration: log.duration,
                        startTime: log.startTime,
                        endTime: log.endTime,
                        taskId: log.taskId
                    });
                }

                await Pomodoro.findOneAndUpdate(
                    { userId, id: log.id },
                    {
                        userId,
                        ...log
                    },
                    { upsert: true, new: true }
                );
                results.logsSynced++;
            }
            console.log(`[Sync All] ✅ ${results.logsSynced} logs synced`);
        }

        // ✅ 4. Sync Settings to SEPARATE collection
        if (settings && typeof settings === 'object' && Object.keys(settings).length > 0) {
            console.log('[Sync All] Syncing settings...');

            await Settings.findOneAndUpdate(
                { userId },
                {
                    userId,
                    BgMusic: settings.BgMusic || '',
                    Volume: settings.Volume || 50,
                    TimerSettings: settings.TimerSettings || {},
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );
            results.settingsSynced = true;
            console.log('[Sync All] ✅ Settings synced');
        }

        // ✅ 5. Update user's last sync time
        await User.findByIdAndUpdate(userId, {
            lastSyncTime: new Date()
        });

        console.log('[Sync All] ✅ COMPLETE SUCCESS');
        res.json(results);

    } catch (error) {
        console.error('[Sync All] ❌ ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Sync failed: ' + error.message
        });
    }
});

// ✅ GRANULAR SYNC ENDPOINTS (Required by frontend SyncService)

// 1. Projects
router.post('/projects', authMiddleware, async (req, res) => {
    try {
        const { projects } = req.body;
        const userId = req.userId;
        let syncedCount = 0;

        if (projects && Array.isArray(projects)) {
            for (const project of projects) {
                await Project.findOneAndUpdate(
                    { userId, id: project.id },
                    { userId, ...project, updatedAt: new Date() },
                    { upsert: true, new: true }
                );
                syncedCount++;
            }
        }

        // Return latest projects to client
        const latestProjects = await Project.find({ userId }).select('-_id -__v -userId').lean();

        res.json({
            success: true,
            projects: latestProjects,
            syncTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Sync Projects] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Tasks
router.post('/tasks', authMiddleware, async (req, res) => {
    try {
        const { tasks } = req.body;
        const userId = req.userId;
        let syncedCount = 0;

        if (tasks && Array.isArray(tasks)) {
            for (const task of tasks) {
                await Task.findOneAndUpdate(
                    { userId, id: task.id },
                    { userId, ...task, updatedAt: new Date() },
                    { upsert: true, new: true }
                );
                syncedCount++;
            }
        }

        const latestTasks = await Task.find({ userId }).select('-_id -__v -userId').lean();

        res.json({
            success: true,
            tasks: latestTasks,
            syncTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Sync Tasks] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Logs (Pomodoro)
router.post('/logs', authMiddleware, async (req, res) => {
    try {
        const { logs } = req.body; // Frontend sends 'logs' locally, but collection is pomodorologs
        const userId = req.userId;
        let syncedCount = 0;

        if (logs && Array.isArray(logs)) {
            for (const log of logs) {
                await Pomodoro.findOneAndUpdate(
                    { userId, id: log.id },
                    { userId, ...log },
                    { upsert: true, new: true }
                );
                syncedCount++;
            }
        }

        const latestLogs = await Pomodoro.find({ userId }).select('-_id -__v -userId').lean();

        res.json({
            success: true,
            logs: latestLogs,
            syncTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Sync Logs] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Settings
router.post('/settings', authMiddleware, async (req, res) => {
    try {
        const { settings } = req.body;
        const userId = req.userId;

        if (settings) {
            await Settings.findOneAndUpdate(
                { userId },
                {
                    userId,
                    BgMusic: settings.bgMusic || '',
                    Volume: settings.volume || 50,
                    TimerSettings: settings.timerSettings || {},
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }

        const latestSettings = await Settings.findOne({ userId }).select('-_id -__v -userId').lean();

        // Transform back to frontend format if needed
        const responseSettings = latestSettings ? {
            bgMusic: latestSettings.BgMusic,
            volume: latestSettings.Volume,
            timerSettings: latestSettings.TimerSettings
        } : {};

        res.json({
            success: true,
            settings: responseSettings
        });
    } catch (error) {
        console.error('[Sync Settings] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ✅ LOAD ALL DATA FROM SERVER
router.get('/load', authMiddleware, async (req, res) => {
    console.log('[Sync Load] Loading data for user:', req.userId);

    try {
        const userId = req.userId;

        // ✅ Get from SEPARATE collections
        const [projects, tasks, logs, settings, user] = await Promise.all([
            Project.find({ userId }).select('-_id -__v').lean(),
            Task.find({ userId }).select('-_id -__v').lean(),
            Pomodoro.find({ userId }).select('-_id -__v').lean(),
            Settings.findOne({ userId }).select('-_id -__v -userId').lean(),
            User.findById(userId).select('email name lastSyncTime')
        ]);

        // ✅ CRITICAL FIX: Properly calculate derived fields from actual data
        const normalizedTasks = await Promise.all(tasks.map(async (t) => {
            // ✅ Count actual pomodoros for this task from logs
            const actualPomoCount = await Pomodoro.countDocuments({
                userId,
                taskId: t.id
            });

            const pomoInterval = Number(t.pomodoroInterval) || 1500;
            const estimateCount = Number(t.estimatePomoNum) || 0;

            return {
                ...t,
                userId: t.userId.toString(),
                uid: t.userId.toString(),

                // ✅ Recalculate from actual logs (not stale MongoDB value)
                actualPomoNum: actualPomoCount,
                actPomodoros: actualPomoCount,

                // ✅ Keep estimate values
                estimatePomoNum: estimateCount,
                estimatedPomodoros: estimateCount,

                // ✅ FIXED: Calculate estimatedTime properly (was hardcoded to 0!)
                estimatedTime: estimateCount * pomoInterval,

                pomodoroInterval: pomoInterval,
                state: Number(t.state) || 0,
                priority: Number(t.priority) || 0,
                order: Number(t.order) || 0,
                sortOrder: Number(t.sortOrder) || 0,
                sync: 1  // Mark as synced when loading from server
            };
        }));

        // Pomodoro Logs - ensure all duration fields are Numbers
        const normalizedLogs = logs.map(l => ({
            ...l,
            duration: Number(l.duration) || 0,
            startTime: Number(l.startTime) || 0,
            endTime: Number(l.endTime) || 0,
            sync: 1
        }));

        console.log('[Sync Load] Data loaded:', {
            projects: projects.length,
            tasks: normalizedTasks.length,
            logs: normalizedLogs.length,
            hasSettings: !!settings
        });

        res.json({
            success: true,
            data: {
                projects: projects || [],
                tasks: normalizedTasks,
                pomodoroLogs: normalizedLogs,
                settings: settings || {},
                user: {
                    email: user.email,
                    name: user.name,
                    lastSyncTime: user.lastSyncTime
                }
            }
        });

    } catch (error) {
        console.error('[Sync Load] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load data: ' + error.message
        });
    }
});

module.exports = router;
