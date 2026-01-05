const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
    console.log(`[Legacy Shim] Handling ${req.method} ${req.originalUrl}`);
    next();
});

router.get('/v64/user/config', (req, res) => {
    res.json({
        success: true,
        config: {}
    });
});

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

router.get('/v61/group/more', (req, res) => {
    res.json({ success: true });
});


router.get('/v62/user/point', (req, res) => {
    res.json({
        success: true,
        points: 0
    });
});


router.post('/v63/exception-report', (req, res) => {
    res.json({ success: true });
});

module.exports = router;
