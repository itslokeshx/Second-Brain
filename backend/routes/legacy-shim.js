const express = require('express');
const router = express.Router();

// Middleware to log legacy requests
router.use((req, res, next) => {
    console.log(`[Legacy Shim] Handling ${req.method} ${req.originalUrl}`);
    next();
});

// GET /v64/user/config
router.get('/v64/user/config', (req, res) => {
    res.json({
        success: true,
        config: {}
    });
});

// POST /v64/sync
router.post('/v64/sync', (req, res) => {
    res.json({
        success: true,
        timestamp: Date.now()
    });
});

// GET /v61/user/groups
router.get('/v61/user/groups', (req, res) => {
    res.json({
        success: true,
        list: []
    });
});

// GET /v61/group/more
router.get('/v61/group/more', (req, res) => {
    res.json({ success: true });
});

// GET /v62/user/point
router.get('/v62/user/point', (req, res) => {
    res.json({
        success: true,
        points: 0
    });
});

// POST /v63/exception-report
router.post('/v63/exception-report', (req, res) => {
    res.json({ success: true });
});

module.exports = router;
