/**
 * System Projects Definition
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL: These projects are MANDATORY for Focus To-Do React hydration.
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
        modifiedDate: now
    };

    // System projects with CORRECT type values from main.js
    window.SYSTEM_PROJECTS = [
        // ═══════════════════════════════════════════════════════════════════
        // DEADLINE-BASED PROJECTS (type 4000+)
        // ═══════════════════════════════════════════════════════════════════
        {
            ...baseProject,
            id: 'today',
            name: 'Today',
            type: 4000,     // l.today = 4e3 = 4000
            deadline: 4000,
            order: 1,
            color: '#FF6B6B'
        },
        {
            ...baseProject,
            id: 'tomorrow',
            name: 'Tomorrow',
            type: 4001,     // l.tomorrow = 4001
            deadline: 4001,
            order: 2,
            color: '#FFB347'
        },
        {
            ...baseProject,
            id: 'planned',
            name: 'Planned',
            type: 4002,     // l.scheduled = 4002
            deadline: 4002,
            order: 3,
            color: '#20B2AA'
        },
        {
            ...baseProject,
            id: 'someday',
            name: 'Someday',
            type: 4003,     // l.someday = 4003
            deadline: 4003,
            order: 4,
            color: '#DDA0DD'
        },
        {
            ...baseProject,
            id: 'next7days',
            name: 'Next 7 Days',
            type: 4004,     // l.next7Days = 4004
            deadline: 4004,
            order: 5,
            color: '#87CEEB'
        },
        {
            ...baseProject,
            id: 'overdue',
            name: 'Overdue',
            type: 4006,     // l.overdue = 4006
            deadline: 4006,
            order: 6,
            color: '#DC143C'
        },
        {
            ...baseProject,
            id: 'week',
            name: 'This Week',
            type: 4007,     // l.thisWeek = 4007
            deadline: 4007,
            order: 7,
            color: '#9370DB'
        },

        // ═══════════════════════════════════════════════════════════════════
        // UTILITY PROJECTS (type 7000+)
        // ═══════════════════════════════════════════════════════════════════
        {
            ...baseProject,
            id: 'all',
            name: 'All',
            type: 7000,     // l.all = 7e3 = 7000
            deadline: 7000,
            order: 8,
            color: '#4A90D9'
        },
        {
            ...baseProject,
            id: 'calendar',
            name: 'Calendar',
            type: 7001,     // l.calendar = 7001
            deadline: 7001,
            order: 9,
            color: '#FF69B4'
        },
        {
            ...baseProject,
            id: 'search',
            name: 'Search',
            type: 7002,     // l.search = 7002
            deadline: 7002,
            order: 10,
            color: '#808080'
        },
        {
            ...baseProject,
            id: 'history',
            name: 'History',
            type: 7003,     // l.history = 7003
            deadline: 7003,
            order: 11,
            color: '#A9A9A9'
        },
        {
            ...baseProject,
            id: 'completed',
            name: 'Completed',
            type: 7003,     // Same as history
            deadline: 7003,
            order: 12,
            color: '#32CD32'
        },

        // ═══════════════════════════════════════════════════════════════════
        // DEFAULT USER PROJECTS (type 1000 = regular project)
        // ═══════════════════════════════════════════════════════════════════
        {
            ...baseProject,
            id: '0',
            name: 'Tasks',
            type: 1000,     // l.project = 1e3 = 1000
            deadline: 0,
            order: 100,
            color: '#4A90D9'
        },
        {
            ...baseProject,
            id: 'inbox',
            name: 'Inbox',
            type: 1000,     // Regular project
            deadline: 0,
            order: 101,
            color: '#87CEEB'
        },
        {
            ...baseProject,
            id: 'default',
            name: 'Default',
            type: 1000,     // Regular project
            deadline: 0,
            order: 102,
            color: '#98D8C8'
        },

        // ═══════════════════════════════════════════════════════════════════
        // SPECIAL VIEWS
        // ═══════════════════════════════════════════════════════════════════
        {
            ...baseProject,
            id: 'myday',
            name: "Today's Tasks",
            type: 4000,     // Same as today
            deadline: 4000,
            order: 0,
            color: '#FF6B6B'
        },
        {
            ...baseProject,
            id: 'upcoming',
            name: 'Upcoming',
            type: 4002,     // Same as scheduled
            deadline: 4002,
            order: 200,
            color: '#20B2AA'
        },
        {
            ...baseProject,
            id: 'focus',
            name: 'Focus',
            type: 1000,     // Regular project
            deadline: 0,
            order: 201,
            color: '#FF4500'
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

    console.log('[System Projects] ✅ Defined', window.SYSTEM_PROJECTS.length, 'mandatory system projects');
    console.log('[System Projects] IDs:', Array.from(window.SYSTEM_PROJECT_IDS).join(', '));
    console.log('[System Projects] Type mapping: today=4000, tomorrow=4001, next7days=4004, all=7000');

})();
