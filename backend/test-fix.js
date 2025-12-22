const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

async function testCompleteFlow() {
    console.log('🧪 Testing Complete Session Flow\n');

    // Test 1: Register
    console.log('1. Registering user...');
    try {
        const email = `test_${Date.now()}@test.com`;
        console.log(`Using email: ${email}`);

        const registerRes = await client.post('http://localhost:3000/v63/user/register', {
            account: email,
            password: 'test123',
            client: 'chrome'
        });

        console.log('✅ Register Response:', {
            status: registerRes.data.status,
            jsessionId: registerRes.data.jsessionId ? 'PRESENT' : 'MISSING',
            cookies: registerRes.headers['set-cookie'] ? 'PRESENT' : 'MISSING'
        });

        // Debug cookies
        console.log('Cookies in jar:', jar.getCookiesSync('http://localhost:3000').map(c => c.key));

        // Test 2: Config endpoint (Verifies Session Persistence)
        console.log('\n2. Testing /v64/user/config...');
        const configRes = await client.get('http://localhost:3000/v64/user/config');

        console.log('✅ Config Response:', {
            status: configRes.data.status,
            user: configRes.data.user ? 'PRESENT' : 'MISSING',
            sessionValid: configRes.data.status === 0 ? 'YES' : 'NO',
            uid: configRes.data.uid,
            acct: configRes.data.acct
        });

        if (configRes.data.status !== 0) {
            console.error('❌ Session invalid after registration!');
            process.exit(1);
        }

        // Test 3: Sync endpoint
        console.log('\n3. Testing /api/sync/tasks...');
        const syncRes = await client.post('http://localhost:3000/api/sync/tasks', {
            tasks: [{ id: 1, title: 'Test Task', completed: false }],
            userEmail: email
        });

        console.log('✅ Sync Response:', {
            status: syncRes.data.status,
            success: syncRes.data.success,
            syncedCount: syncRes.data.syncedCount || 0
        });

        console.log('\n🎉 ALL TESTS PASSED!');

    } catch (error) {
        console.error('❌ TEST FAILED:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        process.exit(1);
    }
}

testCompleteFlow();
