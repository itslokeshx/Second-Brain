// ═══════════════════════════════════════════════════════════════════
// 🔍 SYNC DIAGNOSTIC SCRIPT
// Run this in browser console BEFORE clicking sync
// ═══════════════════════════════════════════════════════════════════

(function () {
    console.log('\n\n');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🔍 SYNC DIAGNOSTIC - Monitoring sync data flow');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    // Intercept fetch to monitor sync calls
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const [url, options] = args;

        if (url && url.includes('/sync')) {
            console.log('\n📡 SYNC REQUEST DETECTED:');
            console.log('  URL:', url);
            console.log('  Method:', options?.method || 'GET');

            if (options?.body) {
                try {
                    const body = JSON.parse(options.body);
                    console.log('  Request Body Keys:', Object.keys(body));
                    if (body.tasks && body.tasks.length > 0) {
                        const task = body.tasks[0];
                        console.log('  Sample Task:', {
                            name: task.name,
                            estimatedTime: task.estimatedTime,
                            actualPomoNum: task.actualPomoNum,
                            estimatePomoNum: task.estimatePomoNum,
                            pomodoroInterval: task.pomodoroInterval
                        });
                    }
                } catch (e) {
                    console.log('  Body:', options.body);
                }
            }

            const response = await originalFetch.apply(this, args);
            const clonedResponse = response.clone();

            try {
                const data = await clonedResponse.json();
                console.log('\n📥 SYNC RESPONSE:');
                console.log('  Success:', data.success);

                if (data.data && data.data.tasks) {
                    console.log('  Tasks received:', data.data.tasks.length);
                    if (data.data.tasks.length > 0) {
                        const task = data.data.tasks[0];
                        console.log('  Sample Task from Server:', {
                            name: task.name,
                            estimatedTime: task.estimatedTime,
                            actualPomoNum: task.actualPomoNum,
                            estimatePomoNum: task.estimatePomoNum,
                            pomodoroInterval: task.pomodoroInterval
                        });

                        // Check for problems
                        if (task.estimatedTime === 0 && task.estimatePomoNum > 0) {
                            console.log('  ⚠️ WARNING: estimatedTime is 0 but estimatePomoNum is', task.estimatePomoNum);
                            console.log('  ⚠️ This will cause NaN! Should be:', task.estimatePomoNum * (task.pomodoroInterval || 1500));
                        }
                    }
                }
            } catch (e) {
                console.log('  Response:', await clonedResponse.text());
            }

            return response;
        }

        return originalFetch.apply(this, args);
    };

    console.log('✅ Sync monitor installed!');
    console.log('Now click the SYNC button and watch the output above.\n');
    console.log('═══════════════════════════════════════════════════════════════════\n\n');
})();
