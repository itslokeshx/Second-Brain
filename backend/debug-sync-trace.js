const axios = require('axios');

async function traceSync() {
    const userId = '694e9a642a49d2ad8f8afeec'; // From logs
    const email = 'bittu@gmail.com'; // From logs

    // 1. First, we need a session. We can try to rely on the backend's token auth or just mock the session cookie if running locally.
    // The backend accepts 'x-session-token'. Server.js line 298.
    // But we need a valid token. The logs showed 'secondbrain.sid'.

    // Easier approach: Use the /v63/user/login endpoint to get a fresh session/token.
    try {
        console.log('--- 1. Authenticating ---');
        const loginRes = await axios.post('http://localhost:3000/v63/user/login', {
            email: email,
            password: 'password' // Assuming this works or I need to register
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        const token = loginRes.data.token;
        const cookie = loginRes.headers['set-cookie'];

        console.log('Logged in. Token:', token);

        // 2. Perform Sync/Load
        console.log('\n--- 2. Tracing Sync Load ---');
        const syncRes = await axios.post('http://localhost:3000/api/sync-data', {}, {
            headers: {
                'x-session-token': token,
                'Cookie': cookie
            }
        });

        const projects = syncRes.data.projects;
        console.log(`Received ${projects.length} projects.`);

        // Analyze Projects
        const systemProjects = projects.filter(p => !p.isDeleted); // basic filter

        console.log('\n--- Project Dump ---');
        systemProjects.forEach(p => {
            console.log(`[${p.id}] ${p.name} (Type: ${p.type}, Order: ${p.order}, Sync: ${p.sync})`);
        });

        // Check for duplicates
        const ids = systemProjects.map(p => p.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
            console.log('\n!!! DUPLICATES DETECTED !!!');
            // Find which ones
            const seen = new Set();
            const dups = ids.filter(x => seen.has(x) || !seen.add(x));
            console.log('Duplicate IDs:', dups);
        } else {
            console.log('\nNo ID duplicates found.');
        }

    } catch (e) {
        console.error('Error:', e.response ? e.response.data : e.message);
    }
}

traceSync();
