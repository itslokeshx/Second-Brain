const express = require('express');
const router = express.Router();
const Pomodoro = require('../models/Pomodoro');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all logs
// @route   GET /api/pomodoro-logs
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const logs = await Pomodoro.find({ userId: req.user._id });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Sync logs (Bulk upsert) - WITH FIREWALL PROTECTION
// @route   POST /api/pomodoro-logs/sync
// @access  Private
router.post('/sync', protect, async (req, res) => {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
        return res.status(400).json({ message: 'Invalid data format. Expected array.' });
    }

    try {
        const { validatePomodoroTimeData } = require('../utils/pomodoroValidation');
        const ops = [];
        let rejectedCount = 0;

        for (const log of data) {
            // ✅ FIREWALL: Validate before adding to bulk operation
            const errors = validatePomodoroTimeData(log);
            if (errors.length > 0) {
                console.error(`[Firewall] ❌ REJECTED invalid Pomodoro ${log.id}:`, errors);
                rejectedCount++;
                continue; // Skip this record entirely
            }

            ops.push({
                updateOne: {
                    filter: { id: log.id, userId: req.user._id },
                    update: { ...log, userId: req.user._id },
                    upsert: true
                }
            });
        }

        if (ops.length > 0) {
            await Pomodoro.bulkWrite(ops);
        }

        const allLogs = await Pomodoro.find({ userId: req.user._id });

        res.json({
            success: true,
            logs: allLogs,
            syncedCount: ops.length,
            rejectedCount
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sync failed: ' + error.message });
    }
});

module.exports = router;
