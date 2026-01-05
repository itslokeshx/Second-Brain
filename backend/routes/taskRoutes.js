const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');


router.get('/', protect, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user._id, isDeleted: false });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.post('/sync', protect, async (req, res) => {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
        return res.status(400).json({ message: 'Invalid data format. Expected array.' });
    }

    try {
        const ops = data.map(task => {
            return {
                updateOne: {
                    filter: { id: task.id, userId: req.user._id },
                    update: { ...task, userId: req.user._id },
                    upsert: true
                }
            };
        });

        if (ops.length > 0) {
            await Task.bulkWrite(ops);
        }

        const allTasks = await Task.find({ userId: req.user._id, isDeleted: false });
        res.json(allTasks);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sync failed: ' + error.message });
    }
});

module.exports = router;
