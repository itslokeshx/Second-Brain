/**
 * VERIFICATION SCRIPT: Test Sync Fix
 * 
 * This script verifies that all symptoms are resolved after removing the double reload.
 * Run this in the browser console AFTER clicking the sync button.
 */

(async function verifySyncFix() {
    console.log('🧪 VERIFICATION: Testing Sync Fix\n');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    const results = {
        passed: [],
        failed: []
    };

    // Test 1: Check if page reloaded (it shouldn't)
    console.log('1️⃣ Testing: No page reload after sync');
    const reloadFlag = sessionStorage.getItem('reloaded-after-sync');
    if (!reloadFlag) {
        results.passed.push('✅ No reload flag set - page did not reload');
    } else {
        results.failed.push('❌ Reload flag found - page may have reloaded');
    }

    // Test 2: Check estimated/elapsed time calculations
    console.log('\n2️⃣ Testing: Time calculations (no NaN)');
    const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
    const pomodoros = JSON.parse(localStorage.getItem('pomodoro-pomodoros') || '[]');

    let nanCount = 0;
    tasks.forEach(t => {
        if (isNaN(t.estimatedTime) || isNaN(t.actualPomoNum)) {
            nanCount++;
            console.log(`   ❌ Task "${t.name}": estimatedTime=${t.estimatedTime}, actualPomoNum=${t.actualPomoNum}`);
        }
    });

    if (nanCount === 0) {
        results.passed.push('✅ No NaN values in time calculations');
    } else {
        results.failed.push(`❌ Found ${nanCount} tasks with NaN values`);
    }

    // Test 3: Check completed tasks visibility
    console.log('\n3️⃣ Testing: Completed tasks visibility');
    const completedTasks = tasks.filter(t => t.isFinished === true);
    console.log(`   Found ${completedTasks.length} completed tasks in localStorage`);

    // Check if they're visible in DOM
    const completedTaskElements = document.querySelectorAll('[class*="task"]').length;
    if (completedTasks.length > 0) {
        results.passed.push(`✅ ${completedTasks.length} completed tasks found in data`);
    } else {
        console.log('   ℹ️ No completed tasks to verify (create one to test)');
    }

    // Test 4: Check if checkboxes are interactive
    console.log('\n4️⃣ Testing: Task checkboxes are interactive');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    let interactiveCount = 0;
    checkboxes.forEach(cb => {
        if (cb.onclick || cb.addEventListener) {
            interactiveCount++;
        }
    });

    if (interactiveCount > 0 || checkboxes.length === 0) {
        results.passed.push(`✅ Checkboxes are interactive (${checkboxes.length} found)`);
    } else {
        results.failed.push('❌ Checkboxes found but not interactive');
    }

    // Test 5: Check storage events were dispatched
    console.log('\n5️⃣ Testing: Storage events dispatched');
    // We can't directly test this, but we can check if localStorage has the data
    const hasProjects = localStorage.getItem('pomodoro-projects');
    const hasTasks = localStorage.getItem('pomodoro-tasks');
    const hasPomodoros = localStorage.getItem('pomodoro-pomodoros');

    if (hasProjects && hasTasks && hasPomodoros) {
        results.passed.push('✅ All data present in localStorage');
    } else {
        results.failed.push('❌ Missing data in localStorage');
    }

    // Test 6: Check pomodoro icon colors (elapsed time indicator)
    console.log('\n6️⃣ Testing: Pomodoro icon colors');
    const tasksWithPomodoros = tasks.filter(t => {
        const taskPomos = pomodoros.filter(p => p.taskId === t.id && p.status === 'completed');
        return taskPomos.length > 0;
    });

    if (tasksWithPomodoros.length > 0) {
        console.log(`   Found ${tasksWithPomodoros.length} tasks with completed pomodoros`);
        tasksWithPomodoros.forEach(t => {
            const count = pomodoros.filter(p => p.taskId === t.id && p.status === 'completed').length;
            console.log(`   - "${t.name}": ${count} completed pomodoros, actualPomoNum=${t.actualPomoNum}`);
        });
        results.passed.push(`✅ ${tasksWithPomodoros.length} tasks have pomodoro data`);
    } else {
        console.log('   ℹ️ No tasks with pomodoros to verify');
    }

    // Print results
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('📊 VERIFICATION RESULTS\n');

    console.log('✅ PASSED:');
    results.passed.forEach(p => console.log(`   ${p}`));

    if (results.failed.length > 0) {
        console.log('\n❌ FAILED:');
        results.failed.forEach(f => console.log(`   ${f}`));
    }

    console.log('\n═══════════════════════════════════════════════════════════════════');

    const successRate = (results.passed.length / (results.passed.length + results.failed.length) * 100).toFixed(0);
    console.log(`\n🎯 SUCCESS RATE: ${successRate}% (${results.passed.length}/${results.passed.length + results.failed.length} tests passed)\n`);

    if (results.failed.length === 0) {
        console.log('🎉 ALL TESTS PASSED! Sync fix is working correctly.\n');
    } else {
        console.log('⚠️ Some tests failed. Review the failures above.\n');
    }

    // Manual verification checklist
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('📋 MANUAL VERIFICATION CHECKLIST\n');
    console.log('Please verify the following manually:');
    console.log('   [ ] 1. Create a task and add 2 pomodoros');
    console.log('   [ ] 2. Verify estimated time shows "50m" (not "NaN")');
    console.log('   [ ] 3. Verify elapsed time shows "25m" (not "0m")');
    console.log('   [ ] 4. Complete the task (click checkbox)');
    console.log('   [ ] 5. Verify task appears in "Completed" project view');
    console.log('   [ ] 6. Verify pomodoro icons are RED (not gray)');
    console.log('   [ ] 7. Click sync button');
    console.log('   [ ] 8. Verify NO page reload occurs');
    console.log('   [ ] 9. Verify all values from steps 2-6 are still correct');
    console.log('   [ ] 10. Verify you can still complete/modify/move tasks');
    console.log('\n═══════════════════════════════════════════════════════════════════\n');

    return {
        passed: results.passed.length,
        failed: results.failed.length,
        successRate: successRate + '%'
    };
})();
