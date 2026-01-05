const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { protect } = require('../middleware/authMiddleware');


router.get('/', protect, async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user._id, isDeleted: false });
        res.json(projects);
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
        const ops = data.map(project => {
            return {
                updateOne: {
                    filter: { id: project.id, userId: req.user._id },
                    update: { ...project, userId: req.user._id },
                    upsert: true
                }
            };
        });

        if (ops.length > 0) {
            await Project.bulkWrite(ops);
        }

        const allProjects = await Project.find({ userId: req.user._id, isDeleted: false });
        res.json(allProjects);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sync failed: ' + error.message });
    }
});

module.exports = router;
