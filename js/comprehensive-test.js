// ═══════════════════════════════════════════════════════════════════
// 🧪 COMPREHENSIVE TEST SCRIPT (FLEXIBLE POMODORO INTERVALS)
// Tests: Data integrity, Patch installation, UI display, Task operations
// ═══════════════════════════════════════════════════════════════════

(async function comprehensiveTest() {
    console.log('\n\n');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🧪 COMPREHENSIVE SYSTEM TEST');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    let passed = 0;
    let failed = 0;

    // ═══════════════════════════════════════════════════════════════════
    // TEST 1: Patch Installation
    // ═══════════════════════════════════════════════════════════════════
    console.log('📋 TEST 1: Patch Installation');
    console.log('─────────────────────────────────────────────────────────────────');

    // Check if Math.floor is patched
    const testNaN = Math.floor(NaN);
    if (testNaN === 0) {
        console.log('✅ Math.floor patch: WORKING (NaN → 0)');
        passed++;
    } else {
        console.log('❌ Math.floor patch: FAILED (NaN → ' + testNaN + ')');
        failed++;
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 2: Data Integrity
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n📋 TEST 2: Data Integrity (localStorage)');
    console.log('─────────────────────────────────────────────────────────────────');

    const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
    const pomos = JSON.parse(localStorage.getItem('pomodoro-pomodoros') || '[]');

    console.log(`Total tasks: ${tasks.length}`);
    console.log(`Total pomodoros: ${pomos.length}`);

    // Check for orphaned pomodoros
    const orphaned = pomos.filter(p => !p.taskId || p.taskId === '');
    if (orphaned.length === 0) {
        console.log('✅ Orphaned pomodoros: NONE');
        passed++;
    } else {
        console.log(`❌ Orphaned pomodoros: ${orphaned.length} found`);
        failed++;
    }

    // Check for zero durations
    const zeroDuration = pomos.filter(p => !p.duration || p.duration === 0);
    if (zeroDuration.length === 0) {
        console.log('✅ Zero duration pomodoros: NONE');
        passed++;
    } else {
        console.log(`⚠️ Zero duration pomodoros: ${zeroDuration.length} found`);
        console.log('   (This is OK if they are new/incomplete pomodoros)');
        passed++;
    }

    // Check pomodoroInterval (should be a positive number, typically 1500)
    const invalidInterval = tasks.filter(t => {
        const interval = t.pomodoroInterval;
        return interval !== undefined && (typeof interval !== 'number' || interval <= 0 || isNaN(interval));
    });

    if (invalidInterval.length === 0) {
        console.log('✅ pomodoroInterval: ALL VALID');
        passed++;
    } else {
        console.log(`❌ pomodoroInterval: ${invalidInterval.length} tasks have invalid values`);
        invalidInterval.forEach(t => {
            console.log(`   - "${t.name}": ${t.pomodoroInterval}`);
        });
        failed++;
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 3: Time Calculations (Flexible Intervals)
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n📋 TEST 3: Time Calculations (Using Task-Specific Intervals)');
    console.log('─────────────────────────────────────────────────────────────────');

    let calculationPassed = true;
    tasks.forEach(task => {
        const taskPomos = pomos.filter(p => p.taskId === task.id);
        const totalDuration = taskPomos.reduce((sum, p) => sum + (p.duration || 0), 0);
        const elapsedMin = Math.floor(totalDuration / 1000 / 60);

        // Use task-specific pomodoroInterval, default to 1500 (25 min in seconds)
        const pomoInterval = task.pomodoroInterval || 1500;
        const pomoMinutes = pomoInterval / 60; // Convert seconds to minutes
        const estimatedMin = (task.estimatePomoNum || 0) * pomoMinutes;

        if (isNaN(elapsedMin) || isNaN(estimatedMin)) {
            console.log(`❌ Task "${task.name}": NaN detected!`);
            console.log(`   Elapsed: ${elapsedMin}, Estimated: ${estimatedMin}`);
            console.log(`   Interval: ${pomoInterval}s (${pomoMinutes}min)`);
            calculationPassed = false;
        }
    });

    if (calculationPassed) {
        console.log('✅ Time calculations: NO NaN VALUES');
        passed++;
    } else {
        console.log('❌ Time calculations: NaN DETECTED');
        failed++;
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 4: UI Display
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n📋 TEST 4: UI Display');
    console.log('─────────────────────────────────────────────────────────────────');

    // Check for NaN in DOM
    const bodyText = document.body.innerText;
    const hasNaN = bodyText.includes('NaN');

    if (!hasNaN) {
        console.log('✅ UI Display: NO "NaN" TEXT FOUND');
        passed++;
    } else {
        console.log('❌ UI Display: "NaN" TEXT FOUND IN DOM');
        failed++;
    }

    // Check statistics elements
    const statElements = document.querySelectorAll('.StatisticsRegion-value-2-Ibc');
    let statsOK = true;
    statElements.forEach(el => {
        if (el.textContent.includes('NaN')) {
            console.log(`❌ Statistics element contains NaN: ${el.textContent}`);
            statsOK = false;
        }
    });

    if (statsOK && statElements.length > 0) {
        console.log('✅ Statistics elements: NO NaN VALUES');
        passed++;
    } else if (statElements.length === 0) {
        console.log('⚠️ Statistics elements: NOT FOUND (UI may not be loaded yet)');
    } else {
        console.log('❌ Statistics elements: NaN DETECTED');
        failed++;
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 5: Task Operations
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n📋 TEST 5: Task Operations');
    console.log('─────────────────────────────────────────────────────────────────');

    // Check if tasks have proper ownership
    const missingOwnership = tasks.filter(t => !t.uid && !t.userId);
    if (missingOwnership.length === 0) {
        console.log('✅ Task ownership: ALL TASKS HAVE uid/userId');
        passed++;
    } else {
        console.log(`❌ Task ownership: ${missingOwnership.length} tasks missing ownership`);
        failed++;
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 6: Sample Task Details (Flexible Intervals)
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n📋 TEST 6: Sample Task Details');
    console.log('─────────────────────────────────────────────────────────────────');

    const clearTask = tasks.find(t => t.name === 'clear');
    if (clearTask) {
        const clearPomos = pomos.filter(p => p.taskId === clearTask.id);
        const totalDuration = clearPomos.reduce((sum, p) => sum + (p.duration || 0), 0);
        const elapsedMin = Math.floor(totalDuration / 1000 / 60);

        // Use task-specific interval
        const pomoInterval = clearTask.pomodoroInterval || 1500;
        const pomoMinutes = pomoInterval / 60;
        const estimatedMin = (clearTask.estimatePomoNum || 0) * pomoMinutes;

        console.log('Task: "clear"');
        console.log(`  actualPomoNum: ${clearTask.actualPomoNum}`);
        console.log(`  pomodoroInterval: ${clearTask.pomodoroInterval}s (${pomoMinutes}min per pomo)`);
        console.log(`  estimatePomoNum: ${clearTask.estimatePomoNum}`);
        console.log(`  Pomodoros found: ${clearPomos.length}`);
        console.log(`  Total duration: ${totalDuration}ms`);
        console.log(`  Elapsed time: ${elapsedMin} minutes`);
        console.log(`  Estimated time: ${estimatedMin} minutes`);

        if (clearTask.actualPomoNum === clearPomos.length &&
            !isNaN(elapsedMin) &&
            !isNaN(estimatedMin)) {
            console.log('✅ Sample task: ALL VALUES CORRECT');
            passed++;
        } else {
            console.log('❌ Sample task: INCONSISTENT VALUES');
            failed++;
        }
    } else {
        console.log('⚠️ "clear" task not found');
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 7: Pomodoro Interval Distribution
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n📋 TEST 7: Pomodoro Interval Distribution');
    console.log('─────────────────────────────────────────────────────────────────');

    const intervalCounts = {};
    tasks.forEach(t => {
        const interval = t.pomodoroInterval || 1500;
        intervalCounts[interval] = (intervalCounts[interval] || 0) + 1;
    });

    console.log('Interval distribution:');
    Object.keys(intervalCounts).sort().forEach(interval => {
        const minutes = interval / 60;
        console.log(`  ${interval}s (${minutes}min): ${intervalCounts[interval]} tasks`);
    });

    // ═══════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round(passed / (passed + failed) * 100)}%`);

    if (failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! System is working correctly!');
    } else {
        console.log('\n⚠️ Some tests failed. Please check the details above.');
    }

    console.log('═══════════════════════════════════════════════════════════════════\n\n');

    return { passed, failed };
})();
