const cron = require('node-cron');
const axios = require('axios');

const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';


function startKeepAlive() {
    if (process.env.NODE_ENV !== 'production') {
        console.log('[Keep-Alive] ⏭️ Skipping in development mode');
        return;
    }

    cron.schedule('*/14 * * * *', async () => {
        try {
            const response = await axios.get(`${RENDER_URL}/health`, {
                timeout: 10000
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
