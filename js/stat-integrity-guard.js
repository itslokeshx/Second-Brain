/**
 * Task Stat Integrity Guard
 * ═══════════════════════════════════════════════════════════════════════════
 * Regression detection for cross-layer state corruption.
 * 
 * Monitors:
 * - Tasks read from IndexedDB with elapsedTime=0 but having pomodoro logs
 * - Tasks with estimatePomoNum=NaN/null
 * - Tasks where actualPomoNum doesn't match pomodoro log count
 * 
 * Reports:
 * - Console warnings with task details
 * - Triggers automatic recalculation if corruption detected
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const GUARD_ENABLED = true;
    const AUTO_FIX = true;

    window.StatIntegrityGuard = {
        /**
         * Validate task statistics against pomodoro logs
         * @param {Array} tasks - Tasks to validate
         * @param {Array} pomodoros - Pomodoro logs
         * @returns {Object} { valid: boolean, corrupted: Array, fixed: Array }
         */
        validateTasks: function (tasks, pomodoros) {
            if (!GUARD_ENABLED || !Array.isArray(tasks)) {
                return { valid: true, corrupted: [], fixed: [] };
            }

            const corrupted = [];
            const fixed = [];

            tasks.forEach(task => {
                const taskPomos = (pomodoros || []).filter(p => p.taskId === task.id);
                const actualCount = taskPomos.length;

                const issues = [];

                // Check 1: elapsedTime is 0 but has pomodoros
                if (actualCount > 0 && (task.elapsedTime === 0 || task.elapsedTime === undefined)) {
                    issues.push(`elapsedTime=0 but has ${actualCount} pomodoros`);
                }

                // Check 2: actualPomoNum mismatch
                if (task.actualPomoNum !== actualCount) {
                    issues.push(`actualPomoNum=${task.actualPomoNum} but has ${actualCount} pomodoros`);
                }

                // Check 3: estimatePomoNum is NaN/null/undefined
                if (task.estimatePomoNum === undefined ||
                    task.estimatePomoNum === null ||
                    Number.isNaN(task.estimatePomoNum)) {
                    issues.push(`estimatePomoNum is ${task.estimatePomoNum}`);
                }

                if (issues.length > 0) {
                    const entry = {
                        taskId: task.id,
                        taskName: task.name,
                        issues: issues,
                        task: task
                    };
                    corrupted.push(entry);

                    console.warn(`[IntegrityGuard] 🚨 CORRUPTED TASK: "${task.name}"`, issues);

                    if (AUTO_FIX && window.SessionManager?.recalculateTaskStats) {
                        const [fixedTask] = window.SessionManager.recalculateTaskStats([task], taskPomos);
                        fixed.push(fixedTask);
                        console.log(`[IntegrityGuard] 🔧 Auto-fixed task "${task.name}"`, {
                            elapsedTime: fixedTask.elapsedTime,
                            actualPomoNum: fixedTask.actualPomoNum,
                            estimatePomoNum: fixedTask.estimatePomoNum
                        });
                    }
                }
            });

            return {
                valid: corrupted.length === 0,
                corrupted: corrupted,
                fixed: fixed
            };
        },

        /**
         * Run integrity check on current IndexedDB data
         */
        runCheck: async function () {
            if (!window.UserDB) {
                console.warn('[IntegrityGuard] UserDB not available');
                return null;
            }

            const userId = window.UserDB.getCurrentUserId();
            if (!userId) {
                console.warn('[IntegrityGuard] No user logged in');
                return null;
            }

            try {
                const db = await window.UserDB.openUserDB(userId);
                const storeNames = Array.from(db.objectStoreNames);

                // Get tasks
                const taskTx = db.transaction('Task', 'readonly');
                const tasks = await new Promise((resolve, reject) => {
                    const req = taskTx.objectStore('Task').getAll();
                    req.onsuccess = () => resolve(req.result || []);
                    req.onerror = () => reject(req.error);
                });

                // Get pomodoros
                const pomoStoreName = storeNames.find(s =>
                    s.toLowerCase().includes('pomodoro') ||
                    s.toLowerCase().includes('log')
                ) || 'PomodoroLog';

                let pomodoros = [];
                if (storeNames.includes(pomoStoreName)) {
                    const pomoTx = db.transaction(pomoStoreName, 'readonly');
                    pomodoros = await new Promise((resolve, reject) => {
                        const req = pomoTx.objectStore(pomoStoreName).getAll();
                        req.onsuccess = () => resolve(req.result || []);
                        req.onerror = () => reject(req.error);
                    });
                }

                const result = this.validateTasks(tasks, pomodoros);

                if (result.valid) {
                    console.log('[IntegrityGuard] ✅ All task stats valid');
                } else {
                    console.warn(`[IntegrityGuard] ⚠️ ${result.corrupted.length} corrupted tasks found`);

                    // Write fixed tasks back if auto-fix enabled
                    if (AUTO_FIX && result.fixed.length > 0) {
                        const writeTx = db.transaction('Task', 'readwrite');
                        const store = writeTx.objectStore('Task');
                        for (const task of result.fixed) {
                            store.put(task);
                        }
                        await new Promise((resolve, reject) => {
                            writeTx.oncomplete = resolve;
                            writeTx.onerror = () => reject(writeTx.error);
                        });
                        console.log(`[IntegrityGuard] ✅ Wrote ${result.fixed.length} fixed tasks to IndexedDB`);
                    }
                }

                return result;
            } catch (error) {
                console.error('[IntegrityGuard] Check failed:', error);
                return null;
            }
        }
    };

    console.log('[IntegrityGuard] 📦 Task Stat Integrity Guard loaded');
})();
