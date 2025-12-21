const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let settings = await Settings.findOne({ userId: req.user._id });
        if (!settings) {
            // Return defaults if not found
            return res.json({});
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private
router.put('/', protect, async (req, res) => {
    try {
        const { bgMusic, volume, timerSettings } = req.body;

        const settings = await Settings.findOneAndUpdate(
            { userId: req.user._id },
            {
                userId: req.user._id,
                bgMusic,
                volume,
                timerSettings
            },
            { new: true, upsert: true }
        );

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
