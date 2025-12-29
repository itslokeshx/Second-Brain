/**
 * Complete System Reset & Diagnostic
 * Run: window.fullSystemReset()
 */
(function () {
    'use strict';

    window.fullSystemReset = async function () {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔧 FULL SYSTEM RESET & DIAGNOSTIC');
        console.log('═══════════════════════════════════════════════════════════\n');

        try {
            // 1. Clear all local storage
            console.log('1️⃣ Clearing localStorage...');
            const lsKeys = Object.keys(localStorage);
            console.log(`   Found ${lsKeys.length} keys`);
            localStorage.clear();
            console.log('   ✅ localStorage cleared\n');

            // 2. Clear session storage
            console.log('2️⃣ Clearing sessionStorage...');
            sessionStorage.clear();
            console.log('   ✅ sessionStorage cleared\n');

            // 3. Delete IndexedDB
            console.log('3️⃣ Deleting IndexedDB...');
            const userId = document.cookie.split(';').find(c => c.trim().startsWith('UID='))?.split('=')[1];
            if (userId) {
                const dbName = `PomodoroDB6_${userId}`;
                await new Promise((resolve, reject) => {
                    const request = indexedDB.deleteDatabase(dbName);
                    request.onsuccess = () => {
                        console.log(`   ✅ Deleted ${dbName}`);
                        resolve();
                    };
                    request.onerror = () => {
                        console.error('   ❌ Failed to delete database');
                        reject(request.error);
                    };
                    request.onblocked = () => {
                        console.warn('   ⚠️ Database deletion blocked - close all tabs');
                    };
                });
            } else {
                console.log('   ⚠️ No user ID found, skipping IndexedDB deletion');
            }
            console.log('');

            // 4. Clear cookies
            console.log('4️⃣ Clearing cookies...');
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const name = cookie.split('=')[0].trim();
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            }
            console.log(`   ✅ Cleared ${cookies.length} cookies\n`);

            // 5. Test backend connection
            console.log('5️⃣ Testing backend connection...');
            try {
                const apiUrl = window.AppConfig?.getApiUrl('/health') || 'https://second-brain-backend-saxs.onrender.com/health';
                const response = await fetch(apiUrl);
                const data = await response.json();
                console.log('   ✅ Backend is online');
                console.log(`   Uptime: ${Math.floor(data.uptime / 60)} minutes`);
                console.log(`   Environment: ${data.environment}\n`);
            } catch (e) {
                console.error('   ❌ Backend connection failed:', e.message);
                console.log('');
            }

            console.log('═══════════════════════════════════════════════════════════');
            console.log('✅ RESET COMPLETE!');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('\n📋 Next Steps:');
            console.log('1. Refresh the page (F5)');
            console.log('2. Login again');
            console.log('3. Create a test task with estimated pomodoros');
            console.log('4. Click Sync');
            console.log('5. Hard reload (Ctrl+Shift+R)');
            console.log('6. Check if duration persists\n');

            return { success: true };
        } catch (e) {
            console.error('❌ Reset failed:', e);
            return { success: false, error: e.message };
        }
    };

    console.log('[System Reset] ✅ Loaded');
    console.log('Run: window.fullSystemReset()');
})();
