/**
 * Task Completion Diagnostic
 * Run this in the browser console to trace what happens when you click a task checkbox
 */

(function () {
    'use strict';

    console.log('[Task Diagnostic] Installing completion tracer...');

    // Store original IDBObjectStore.put
    const originalPut = IDBObjectStore.prototype.put;
    const originalUpdate = IDBCursor.prototype.update;

    // Track all task writes
    IDBObjectStore.prototype.put = function (value, key) {
        if (this.name === 'Task' && value) {
            console.log('[Task Diagnostic] 📝 Task PUT:', {
                id: value.id?.substring(0, 8),
                name: value.name,
                isFinished: value.isFinished,
                completed: value.completed,
                state: value.state,
                sync: value.sync,
                userId: value.userId,
                uid: value.uid,
                stackTrace: new Error().stack.split('\n').slice(2, 5).join('\n')
            });
        }
        return originalPut.call(this, value, key);
    };

    IDBCursor.prototype.update = function (value) {
        if (this.source.name === 'Task' && value) {
            console.log('[Task Diagnostic] 🔄 Task UPDATE:', {
                id: value.id?.substring(0, 8),
                name: value.name,
                isFinished: value.isFinished,
                completed: value.completed,
                state: value.state,
                sync: value.sync,
                userId: value.userId,
                uid: value.uid,
                stackTrace: new Error().stack.split('\n').slice(2, 5).join('\n')
            });
        }
        return originalUpdate.call(this, value);
    };

    // Track localStorage writes
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
        if (key === 'pomodoro-tasks') {
            try {
                const tasks = JSON.parse(value);
                console.log('[Task Diagnostic] 💾 localStorage tasks updated:', {
                    count: tasks.length,
                    finishedCount: tasks.filter(t => t.isFinished).length,
                    stackTrace: new Error().stack.split('\n').slice(2, 5).join('\n')
                });
            } catch (e) { }
        }
        return originalSetItem.call(this, key, value);
    };

    // Track click events on checkboxes
    document.addEventListener('click', function (e) {
        const target = e.target;
        if (target.type === 'checkbox' || target.closest('[role="checkbox"]')) {
            console.log('[Task Diagnostic] ✅ Checkbox clicked:', {
                element: target.outerHTML?.substring(0, 100),
                checked: target.checked,
                timestamp: Date.now()
            });
        }
    }, true);

    console.log('[Task Diagnostic] ✅ Tracer installed');
    console.log('[Task Diagnostic] Now try to complete a task and watch the console');
    console.log('[Task Diagnostic] Look for:');
    console.log('  1. Checkbox click event');
    console.log('  2. Task PUT/UPDATE to IndexedDB');
    console.log('  3. localStorage update');
    console.log('  4. Any errors or missing steps');

})();
