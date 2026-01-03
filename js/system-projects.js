/**
 * System Projects Definition
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL: These projects are MANDATORY for Second Brain React hydration.
 * If any are missing from IndexedDB, the UI will not render (blank screen).
 * 
 * The main.js webpack bundle checks for `props.todayProject` before mounting.
 * If this project is undefined, React returns null and the screen stays blank.
 * 
 * TYPE VALUES FROM main.js:
 * - l.project = 1000 (regular project)
 * - l.folder = 2000
 * - l.tag = 3000
 * - l.today = 4000 ← CRITICAL
 * - l.tomorrow = 4001
 * - l.scheduled = 4002
 * - l.someday = 4003
 * - l.next7Days = 4004
 * - l.overdue = 4006
 * - l.thisWeek = 4007
 * - l.all = 7000
 * - l.calendar = 7001
 * - l.search = 7002
 * - l.history = 7003
 * - l.tasks = 7005
 * 
 * DO NOT MODIFY THESE TYPE VALUES - they are hardcoded in main.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const now = Date.now();

    // Base template for system projects
    const baseProject = {
        isSystem: true,
        isPreset: true,
        hidden: false,
        state: 0,
        sync: 1,
        order: 0,
        color: '#4A90D9',
        parentId: '',
        createdDate: now,
        modifiedDate: now,
        // ═══════════════════════════════════════════════════════════════════
        // 🛡️ NaN PREVENTION: Default stat fields for main.js calculations
        // Without these, main.js will compute: estimatedTime = undefined * 25 = NaN
        // ═══════════════════════════════════════════════════════════════════
        estimatePomoNum: 0,
        actualPomoNum: 0,
        elapsedTime: 0
    };

    // System projects with CORRECT IDs and type values from main.js
    // CRITICAL: IDs must match main.js hardcoded values (e.g. "id-deadline-today" not "today")
    window.SYSTEM_PROJECTS = [
        // ═══════════════════════════════════════════════════════════════════
        // DEADLINE-BASED PROJECTS (type 4000+)
        // ═══════════════════════════════════════════════════════════════════
        {
            ...baseProject,
            id: 'id-task-search',  // main.js line 14858
            name: 'PRJ_SEARCH',
            type: 7002,     // l.search = 7002
            deadline: 7002,
            orderingRule: 0,
            order: -2100,
            color: '#808080'
        },
        {
            ...baseProject,
            id: 'id-deadline-today',  // main.js line 14865 - CRITICAL for todayProject
            name: 'PRJ_TODAY',
            type: 4000,     // l.today = 4e3 = 4000
            deadline: 4000,
            orderingRule: 0,
            order: -2090,
            color: '#FF6B6B'
        },
        {
            ...baseProject,
            id: 'id-deadline-overdue',  // main.js line 14872
            name: 'PRJ_DEADLINE_OVERDUE',
            type: 4006,     // l.overdue = 4006
            deadline: 4006,
            orderingRule: 1,  // deadline ordering
            order: -2085,
            state: 1,  // hidden by default
            color: '#DC143C'
        },
        {
            ...baseProject,
            id: 'id-deadline-tomorrow',  // main.js line 14880
            name: 'PRJ_TOMORROW',
            type: 4001,     // l.tomorrow = 4001
            deadline: 4001,
            orderingRule: 0,
            order: -2080,
            color: '#FFB347'
        },
        {
            ...baseProject,
            id: 'id-deadline-week',  // main.js line 14887
            name: 'PRJ_DEADLINE_WEEK',
            type: 4007,     // l.thisWeek = 4007
            deadline: 4007,
            orderingRule: 1,  // deadline ordering
            order: -2078,
            color: '#9370DB'
        },
        {
            ...baseProject,
            id: 'id-deadline-last7days',  // main.js line 14894
            name: 'PRJ_DEADLINE_LAST7DAYS',
            type: 4004,     // l.next7Days = 4004
            deadline: 4004,
            orderingRule: 1,  // deadline ordering
            order: -2076,
            state: 1,  // hidden by default
            color: '#87CEEB'
        },
        {
            ...baseProject,
            id: 'id-priority-high',  // main.js line 14902
            name: 'PRJ_PRIORITY_HIGH',
            type: 5003,     // l.priorityHigh = 5003
            deadline: 5003,
            orderingRule: 0,
            order: -2074,
            state: 1,  // hidden by default
            color: '#DC143C'
        },
        {
            ...baseProject,
            id: 'id-priority-medium',  // main.js line 14910
            name: 'PRJ_PRIORITY_MEDIUM',
            type: 5002,     // l.priorityMedium = 5002
            deadline: 5002,
            orderingRule: 0,
            order: -2073,
            state: 1,  // hidden by default
            color: '#FFB347'
        },
        {
            ...baseProject,
            id: 'id-priority-low',  // main.js line 14918
            name: 'PRJ_PRIORITY_LOW',
            type: 5001,     // l.priorityLow = 5001
            deadline: 5001,
            orderingRule: 0,
            order: -2072,
            state: 1,  // hidden by default
            color: '#87CEEB'
        },
        {
            ...baseProject,
            id: 'id-deadline-upcoming',  // main.js line 14926
            name: 'PRJ_UPCOMING',
            type: 4002,     // l.scheduled = 4002
            deadline: 4002,
            orderingRule: 1,  // deadline ordering
            order: -2070,
            color: '#20B2AA'
        },
        {
            ...baseProject,
            id: 'id-deadline-someday',  // main.js line 14934
            name: 'PRJ_SOMEDAY',
            type: 4003,     // l.someday = 4003
            deadline: 4003,
            orderingRule: 1,  // deadline ordering
            order: -2060,
            state: 1,  // hidden by default
            color: '#DDA0DD'
        },
        {
            ...baseProject,
            id: 'id-task-all',  // main.js line 14942
            name: 'PRJ_ALL',
            type: 7000,     // l.all = 7e3 = 7000
            deadline: 7000,
            orderingRule: 0,
            order: -2050,
            color: '#4A90D9'
        },
        {
            ...baseProject,
            id: 'id-task-schedule',  // main.js line 14950
            name: 'PRJ_SCHEDULE',
            type: 7001,     // l.calendar = 7001
            deadline: 7001,
            orderingRule: 0,
            order: -2040,
            color: '#FF69B4'
        },
        {
            ...baseProject,
            id: 'id-task-history',  // main.js line 14958
            name: 'PRJ_HISTORY',
            type: 7003,     // l.history = 7003
            deadline: 7003,
            orderingRule: 0,
            order: -2030,
            color: '#32CD32'
        },
        {
            ...baseProject,
            id: 'id-task-tasks',  // main.js line 14966
            name: 'PRJ_TASKS',
            type: 7005,     // l.tasks = 7005
            deadline: 7005,
            orderingRule: 0,
            order: -2020,
            color: '#4A90D9'
        },

        // ═══════════════════════════════════════════════════════════════════
        // LEGACY/COMPATIBILITY IDs (keep for backward compatibility)
        // ═══════════════════════════════════════════════════════════════════
        {
            ...baseProject,
            id: '0',
            name: 'Tasks',
            type: 1000,     // l.project = 1e3 = 1000 (regular project)
            deadline: 0,
            order: 100,
            color: '#4A90D9'
        }
    ];

    // Create lookup map for fast access
    window.SYSTEM_PROJECT_IDS = new Set(window.SYSTEM_PROJECTS.map(p => p.id));

    // Helper function to check if an ID is a system project
    window.isSystemProject = function (id) {
        return window.SYSTEM_PROJECT_IDS.has(String(id));
    };

    // Helper function to get system project by ID
    window.getSystemProject = function (id) {
        return window.SYSTEM_PROJECTS.find(p => p.id === String(id));
    };


})();
