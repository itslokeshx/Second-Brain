const cron = require('node-cron');
const axios = require('axios');

// Get Render URL from environment variable
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';

/**
 * Keep-Alive Service
 * Prevents Render free tier from sleeping by pinging itself every 14 minutes
 */
function startKeepAlive() {
    // Only run in production (Render environment)
    if (process.env.NODE_ENV !== 'production') {
        console.log('[Keep-Alive] ⏭️ Skipping in development mode');
        return;
    }

    // Schedule ping every 14 minutes (before 15-minute Render timeout)
    cron.schedule('*/14 * * * *', async () => {
        try {
            const response = await axios.get(`${RENDER_URL}/health`, {
                timeout: 10000 // 10 second timeout
            });

            console.log(`[Keep-Alive] ✅ Ping successful at ${new Date().toISOString()}`);
            console.log(`[Keep-Alive] Status: ${response.status} | Uptime: ${response.data.uptime}s`);
        } catch (error) {
            console.error(`[Keep-Alive] ❌ Ping failed at ${new Date().toISOString()}`);
            console.error(`[Keep-Alive] Error: ${error.message}`);
        }
    });

    console.log('[Keep-Alive] 🚀 Self-ping cron job started');
    console.log('[Keep-Alive] 📅 Schedule: Every 14 minutes');
    console.log(`[Keep-Alive] 🎯 Target: ${RENDER_URL}/health`);
}

module.exports = { startKeepAlive };
