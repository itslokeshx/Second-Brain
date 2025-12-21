const express = require('express');
const router = express.Router();
const PomodoroLog = require('../models/PomodoroLog');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all logs
// @route   GET /api/pomodoro-logs
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const logs = await PomodoroLog.find({ userId: req.user._id });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Sync logs (Bulk upsert)
// @route   POST /api/pomodoro-logs/sync
// @access  Private
router.post('/sync', protect, async (req, res) => {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
        return res.status(400).json({ message: 'Invalid data format. Expected array.' });
    }

    try {
        const ops = data.map(log => {
            return {
                updateOne: {
                    filter: { id: log.id, userId: req.user._id },
                    update: { ...log, userId: req.user._id },
                    upsert: true
                }
            };
        });

        if (ops.length > 0) {
            await PomodoroLog.bulkWrite(ops);
        }

        const allLogs = await PomodoroLog.find({ userId: req.user._id });
        res.json(allLogs);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sync failed: ' + error.message });
    }
});

module.exports = router;
