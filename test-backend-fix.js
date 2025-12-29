/**
 * Backend Fix Verification Test
 * Tests if Render backend has the duration field normalization
 */
(async function () {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧪 BACKEND FIX VERIFICATION TEST');
    console.log('═══════════════════════════════════════════════════════════\n');

    const testTask = {
        id: 'TEST-' + Date.now(),
        name: 'Test Task',
        projectId: '0',
        // Intentionally send undefined duration fields
        estimatePomoNum: undefined,
        actualPomoNum: undefined,
        pomodoroInterval: undefined
    };

    console.log('1️⃣ Sending test task with undefined duration fields...');
    console.log('   Task:', testTask);

    try {
        const apiUrl = window.AppConfig?.getApiUrl('/api/sync/all') || 'https://second-brain-backend-saxs.onrender.com/api/sync/all';
        const token = localStorage.getItem('authToken');

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                projects: [],
                tasks: [testTask],
                pomodoroLogs: []
            })
        });

        const result = await response.json();
        console.log('\n2️⃣ Backend response:', result);

        if (result.success) {
            console.log('   ✅ Sync successful\n');

            // Now load the task back from MongoDB
            console.log('3️⃣ Loading task back from MongoDB...');
            const loadResponse = await fetch(apiUrl.replace('/all', '-data'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({})
            });

            const loadResult = await loadResponse.json();
            const savedTask = loadResult.tasks?.find(t => t.id === testTask.id);

            if (savedTask) {
                console.log('   ✅ Task found in MongoDB\n');
                console.log('4️⃣ Checking duration fields...');
                console.log('   estimatePomoNum:', savedTask.estimatePomoNum, typeof savedTask.estimatePomoNum);
                console.log('   actualPomoNum:', savedTask.actualPomoNum, typeof savedTask.actualPomoNum);
                console.log('   pomodoroInterval:', savedTask.pomodoroInterval, typeof savedTask.pomodoroInterval);

                const hasValidFields =
                    typeof savedTask.estimatePomoNum === 'number' &&
                    typeof savedTask.actualPomoNum === 'number' &&
                    typeof savedTask.pomodoroInterval === 'number' &&
                    savedTask.pomodoroInterval === 1500;

                console.log('\n═══════════════════════════════════════════════════════════');
                if (hasValidFields) {
                    console.log('✅ BACKEND FIX IS WORKING!');
                    console.log('   Duration fields were normalized correctly');
                } else {
                    console.log('❌ BACKEND FIX NOT WORKING!');
                    console.log('   Duration fields are still undefined/invalid');
                    console.log('   Render might not have deployed the new code');
                }
                console.log('═══════════════════════════════════════════════════════════');
            } else {
                console.log('   ❌ Task not found in MongoDB');
            }
        } else {
            console.log('   ❌ Sync failed:', result.message);
        }
    } catch (e) {
        console.error('❌ Test failed:', e);
    }
})();
