/**
 * Duration Debug Console
 * Comprehensive diagnostic tool for debugging NaN duration and sync issues
 * Usage: Open browser console and type: window.durationDebug.runAll()
 */
(function () {
    'use strict';

    console.log('[Duration Debug] Loading diagnostic tools...');

    const DurationDebug = {
        // ═══════════════════════════════════════════════════════════════════════
        // 1. CHECK LOCALSTORAGE DATA
        // ═══════════════════════════════════════════════════════════════════════
        checkLocalStorage: function () {
            console.log('\n═══════════════════════════════════════════════════════════');
            console.log('📦 LOCALSTORAGE DURATION DATA');
            console.log('═══════════════════════════════════════════════════════════\n');

            try {
                const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
                const pomodoros = JSON.parse(localStorage.getItem('pomodoro-pomodoros') || '[]');

                console.log(`Total Tasks: ${tasks.length}`);
                console.log(`Total Pomodoros: ${pomodoros.length}\n`);

                // Check each task's duration fields
                let validTasks = 0;
                let invalidTasks = 0;
                const issues = [];

                tasks.forEach((task, index) => {
                    const hasValidEstimate = typeof task.estimatePomoNum === 'number' && !isNaN(task.estimatePomoNum);
                    const hasValidActual = typeof task.actualPomoNum === 'number' && !isNaN(task.actualPomoNum);
                    const hasValidInterval = typeof task.pomodoroInterval === 'number' && !isNaN(task.pomodoroInterval) && task.pomodoroInterval > 0;

                    if (hasValidEstimate && hasValidActual && hasValidInterval) {
                        validTasks++;
                    } else {
                        invalidTasks++;
                        issues.push({
                            index,
                            name: task.name,
                            estimatePomoNum: task.estimatePomoNum,
                            actualPomoNum: task.actualPomoNum,
                            pomodoroInterval: task.pomodoroInterval,
                            issues: [
                                !hasValidEstimate && 'Invalid estimatePomoNum',
                                !hasValidActual && 'Invalid actualPomoNum',
                                !hasValidInterval && 'Invalid pomodoroInterval'
                            ].filter(Boolean)
                        });
                    }
                });

                console.log(`✅ Valid Tasks: ${validTasks}`);
                console.log(`❌ Invalid Tasks: ${invalidTasks}\n`);

                if (issues.length > 0) {
                    console.log('🔍 TASKS WITH ISSUES:');
                    console.table(issues);
                }

                // Check pomodoro logs
                let validLogs = 0;
                let invalidLogs = 0;
                const logIssues = [];

                pomodoros.forEach((log, index) => {
                    const hasValidDuration = typeof log.duration === 'number' && !isNaN(log.duration);
                    const hasValidStart = typeof log.startTime === 'number' && !isNaN(log.startTime);
                    const hasValidEnd = typeof log.endTime === 'number' && !isNaN(log.endTime);

                    if (hasValidDuration && hasValidStart && hasValidEnd) {
                        validLogs++;
                    } else {
                        invalidLogs++;
                        logIssues.push({
                            index,
                            id: log.id,
                            duration: log.duration,
                            startTime: log.startTime,
                            endTime: log.endTime,
                            issues: [
                                !hasValidDuration && 'Invalid duration',
                                !hasValidStart && 'Invalid startTime',
                                !hasValidEnd && 'Invalid endTime'
                            ].filter(Boolean)
                        });
                    }
                });

                console.log(`\n✅ Valid Pomodoro Logs: ${validLogs}`);
                console.log(`❌ Invalid Pomodoro Logs: ${invalidLogs}\n`);

                if (logIssues.length > 0) {
                    console.log('🔍 POMODORO LOGS WITH ISSUES:');
                    console.table(logIssues);
                }

                return { tasks: { valid: validTasks, invalid: invalidTasks, issues }, logs: { valid: validLogs, invalid: invalidLogs, issues: logIssues } };
            } catch (e) {
                console.error('❌ Error checking localStorage:', e);
                return null;
            }
        },

        // ═══════════════════════════════════════════════════════════════════════
        // 2. CHECK INDEXEDDB DATA
        // ═══════════════════════════════════════════════════════════════════════
        checkIndexedDB: async function () {
            console.log('\n═══════════════════════════════════════════════════════════');
            console.log('💾 INDEXEDDB DURATION DATA');
            console.log('═══════════════════════════════════════════════════════════\n');

            try {
                const dbName = window.UserDB ? window.UserDB.getDBName() : 'PomodoroDB6';
                console.log(`Opening database: ${dbName}`);

                const db = await new Promise((resolve, reject) => {
                    const request = indexedDB.open(dbName);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                const storeNames = Array.from(db.objectStoreNames);
                console.log(`Available stores: ${storeNames.join(', ')}\n`);

                // Check Task store
                const taskStoreName = storeNames.find(s => s.toLowerCase().includes('task'));
                if (taskStoreName) {
                    const tasks = await new Promise((resolve, reject) => {
                        const tx = db.transaction(taskStoreName, 'readonly');
                        const store = tx.objectStore(taskStoreName);
                        const request = store.getAll();
                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => reject(request.error);
                    });

                    console.log(`Tasks in IndexedDB: ${tasks.length}`);

                    let validTasks = 0;
                    let invalidTasks = 0;

                    tasks.forEach(task => {
                        const hasValidEstimate = typeof task.estimatePomoNum === 'number' && !isNaN(task.estimatePomoNum);
                        const hasValidActual = typeof task.actualPomoNum === 'number' && !isNaN(task.actualPomoNum);

                        if (hasValidEstimate && hasValidActual) {
                            validTasks++;
                        } else {
                            invalidTasks++;
                        }
                    });

                    console.log(`✅ Valid: ${validTasks}, ❌ Invalid: ${invalidTasks}`);
                }

                // Check Pomodoro store
                const pomoStoreName = storeNames.find(s => s.toLowerCase().includes('pomodoro') || s.toLowerCase().includes('log'));
                if (pomoStoreName) {
                    const logs = await new Promise((resolve, reject) => {
                        const tx = db.transaction(pomoStoreName, 'readonly');
                        const store = tx.objectStore(pomoStoreName);
                        const request = store.getAll();
                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => reject(request.error);
                    });

                    console.log(`\nPomodoro Logs in IndexedDB: ${logs.length}`);

                    let validLogs = 0;
                    let invalidLogs = 0;

                    logs.forEach(log => {
                        const hasValidDuration = typeof log.duration === 'number' && !isNaN(log.duration);
                        if (hasValidDuration) {
                            validLogs++;
                        } else {
                            invalidLogs++;
                        }
                    });

                    console.log(`✅ Valid: ${validLogs}, ❌ Invalid: ${invalidLogs}`);
                }

                db.close();
            } catch (e) {
                console.error('❌ Error checking IndexedDB:', e);
            }
        },

        // ═══════════════════════════════════════════════════════════════════════
        // 3. CHECK UI CALCULATION
        // ═══════════════════════════════════════════════════════════════════════
        checkUICalculation: function () {
            console.log('\n═══════════════════════════════════════════════════════════');
            console.log('🖥️  UI DURATION CALCULATION');
            console.log('═══════════════════════════════════════════════════════════\n');

            try {
                const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');

                // Simulate the calculation that main.js does
                let totalMinutes = 0;
                let calculationSteps = [];

                tasks.forEach(task => {
                    if (task.state === 0) { // Only count active tasks
                        const estimate = task.estimatePomoNum || 0;
                        const interval = task.pomodoroInterval || 1500;
                        const minutes = (estimate * interval) / 60;

                        totalMinutes += minutes;

                        calculationSteps.push({
                            name: task.name,
                            estimatePomoNum: estimate,
                            pomodoroInterval: interval,
                            calculatedMinutes: minutes,
                            isValid: !isNaN(minutes)
                        });
                    }
                });

                const hours = Math.floor(totalMinutes / 60);
                const minutes = Math.floor(totalMinutes % 60);

                console.log('Calculation Steps:');
                console.table(calculationSteps);

                console.log(`\nTotal Minutes: ${totalMinutes}`);
                console.log(`Formatted: ${hours}h ${minutes}m`);

                if (isNaN(hours) || isNaN(minutes)) {
                    console.error('❌ CALCULATION RESULTED IN NaN!');
                } else {
                    console.log('✅ Calculation is valid');
                }

                return { hours, minutes, totalMinutes, steps: calculationSteps };
            } catch (e) {
                console.error('❌ Error in UI calculation:', e);
                return null;
            }
        },

        // ═══════════════════════════════════════════════════════════════════════
        // 4. CHECK IMAGE PATHS
        // ═══════════════════════════════════════════════════════════════════════
        checkImagePaths: function () {
            console.log('\n═══════════════════════════════════════════════════════════');
            console.log('🖼️  POMODORO IMAGE PATHS');
            console.log('═══════════════════════════════════════════════════════════\n');

            const images = document.querySelectorAll('img');
            let brokenImages = 0;
            let validImages = 0;
            const brokenList = [];

            images.forEach((img, index) => {
                const src = img.getAttribute('src');
                const parent = img.closest('[class*="pomodoro"], [class*="pomo"], [class*="TaskItem"]');

                if (parent) {
                    if (!src || src === '' || src === 'undefined') {
                        brokenImages++;
                        brokenList.push({
                            index,
                            src: src || '(empty)',
                            parentClass: parent.className
                        });
                    } else {
                        validImages++;
                    }
                }
            });

            console.log(`Total Pomodoro Images: ${brokenImages + validImages}`);
            console.log(`✅ Valid: ${validImages}`);
            console.log(`❌ Broken: ${brokenImages}\n`);

            if (brokenList.length > 0) {
                console.log('🔍 BROKEN IMAGES:');
                console.table(brokenList);
            }

            return { valid: validImages, broken: brokenImages, brokenList };
        },

        // ═══════════════════════════════════════════════════════════════════════
        // 5. FIX DATA NOW
        // ═══════════════════════════════════════════════════════════════════════
        fixDataNow: function () {
            console.log('\n═══════════════════════════════════════════════════════════');
            console.log('🔧 FIXING DATA NOW');
            console.log('═══════════════════════════════════════════════════════════\n');

            try {
                const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
                const pomodoros = JSON.parse(localStorage.getItem('pomodoro-pomodoros') || '[]');

                let tasksFix = 0;
                let pomodorosFix = 0;

                // Fix tasks
                tasks.forEach(task => {
                    let fixed = false;

                    if (typeof task.estimatePomoNum !== 'number' || isNaN(task.estimatePomoNum)) {
                        task.estimatePomoNum = 0;
                        fixed = true;
                    }

                    if (typeof task.actualPomoNum !== 'number' || isNaN(task.actualPomoNum)) {
                        task.actualPomoNum = 0;
                        fixed = true;
                    }

                    if (typeof task.estimatedPomodoros !== 'number' || isNaN(task.estimatedPomodoros)) {
                        task.estimatedPomodoros = task.estimatePomoNum || 0;
                        fixed = true;
                    }

                    if (typeof task.actPomodoros !== 'number' || isNaN(task.actPomodoros)) {
                        task.actPomodoros = task.actualPomoNum || 0;
                        fixed = true;
                    }

                    if (typeof task.pomodoroInterval !== 'number' || isNaN(task.pomodoroInterval) || task.pomodoroInterval <= 0) {
                        task.pomodoroInterval = 1500;
                        fixed = true;
                    }

                    if (fixed) {
                        tasksFix++;
                        task.sync = 0; // Mark as dirty
                    }
                });

                // Fix pomodoros
                pomodoros.forEach(pomo => {
                    let fixed = false;

                    if (typeof pomo.duration !== 'number' || isNaN(pomo.duration)) {
                        if (pomo.startTime && pomo.endTime) {
                            pomo.duration = pomo.endTime - pomo.startTime;
                        } else {
                            pomo.duration = 0;
                        }
                        fixed = true;
                    }

                    if (typeof pomo.startTime !== 'number' || isNaN(pomo.startTime)) {
                        pomo.startTime = 0;
                        fixed = true;
                    }

                    if (typeof pomo.endTime !== 'number' || isNaN(pomo.endTime)) {
                        pomo.endTime = 0;
                        fixed = true;
                    }

                    if (fixed) {
                        pomodorosFix++;
                        pomo.sync = 0; // Mark as dirty
                    }
                });

                // Save back to localStorage
                localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));
                localStorage.setItem('pomodoro-pomodoros', JSON.stringify(pomodoros));

                console.log(`✅ Fixed ${tasksFix} tasks`);
                console.log(`✅ Fixed ${pomodorosFix} pomodoro logs`);
                console.log('\n🔄 Please refresh the page to see changes');

                return { tasksFix, pomodorosFix };
            } catch (e) {
                console.error('❌ Error fixing data:', e);
                return null;
            }
        },

        // ═══════════════════════════════════════════════════════════════════════
        // 6. RUN ALL DIAGNOSTICS
        // ═══════════════════════════════════════════════════════════════════════
        runAll: async function () {
            console.clear();
            console.log('╔═══════════════════════════════════════════════════════════╗');
            console.log('║     DURATION & IMAGE DEBUG - FULL DIAGNOSTIC SUITE       ║');
            console.log('╚═══════════════════════════════════════════════════════════╝');

            const results = {
                localStorage: this.checkLocalStorage(),
                indexedDB: await this.checkIndexedDB(),
                uiCalculation: this.checkUICalculation(),
                imagePaths: this.checkImagePaths()
            };

            console.log('\n═══════════════════════════════════════════════════════════');
            console.log('📊 SUMMARY');
            console.log('═══════════════════════════════════════════════════════════\n');

            const hasIssues =
                (results.localStorage?.tasks.invalid > 0) ||
                (results.localStorage?.logs.invalid > 0) ||
                (results.imagePaths?.broken > 0) ||
                (results.uiCalculation && (isNaN(results.uiCalculation.hours) || isNaN(results.uiCalculation.minutes)));

            if (hasIssues) {
                console.error('❌ ISSUES DETECTED!');
                console.log('\nTo fix automatically, run: window.durationDebug.fixDataNow()');
            } else {
                console.log('✅ ALL CHECKS PASSED!');
            }

            return results;
        }
    };

    // Expose globally
    window.durationDebug = DurationDebug;

    console.log('[Duration Debug] ✅ Loaded');
    console.log('Usage: window.durationDebug.runAll()');
    console.log('Or run individual checks:');
    console.log('  - window.durationDebug.checkLocalStorage()');
    console.log('  - window.durationDebug.checkIndexedDB()');
    console.log('  - window.durationDebug.checkUICalculation()');
    console.log('  - window.durationDebug.checkImagePaths()');
    console.log('  - window.durationDebug.fixDataNow()');
})();
