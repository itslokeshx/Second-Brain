/**
 * System Projects Definition
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL: These 18 projects are MANDATORY for Focus To-Do React hydration.
 * If any are missing from IndexedDB, the UI will not render (blank screen).
 * 
 * The main.js webpack bundle checks for `props.todayProject` before mounting.
 * If this project is undefined, React returns null and the screen stays blank.
 * 
 * DO NOT MODIFY PROJECT IDS - they are hardcoded in main.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const now = Date.now();

    /**
     * System Project Types (from main.js reverse engineering):
     * - Type 0: Normal project / Inbox
     * - Type 10: Today (deadline today)
     * - Type 11: Tomorrow (deadline tomorrow)
     * - Type 12: Next 7 Days
     * - Type 13: Someday
     * - Type 14: Completed/History
     * - Type 15: All
     * - Type 16: Calendar
     * - Type 17: Overdue
     * - Type 18: Search
     * - Type 19: Week
     * - Type 20: Planned/Upcoming
     */

    // Base template for system projects
    const baseProject = {
        isSystem: true,           // CRITICAL: Marker for sync protection
        isPreset: true,           // Legacy marker
        hidden: false,
        state: 0,                 // 0 = active
        sync: 1,                  // Mark as synced
        order: 0,
        color: '#4A90D9',
        parentId: '',
        createdDate: now,
        modifiedDate: now
    };

    // The 18 mandatory system projects
    window.SYSTEM_PROJECTS = [
        // ═══════════════════════════════════════════════════════════════════
        // DEADLINE-BASED PROJECTS (These power the sidebar navigation)
        // ═══════════════════════════════════════════════════════════════════
        {
            ...baseProject,
            id: 'today',
            name: 'Today',
            type: 10,
            deadline: 10,
            order: 1,
            color: '#FF6B6B'
        },
        {
            ...baseProject,
            id: 'tomorrow',
            name: 'Tomorrow',
            type: 11,
            deadline: 11,
            order: 2,
            color: '#FFB347'
        },
        {
            ...baseProject,
            id: 'next7days',
            name: 'Next 7 Days',
            type: 12,
            deadline: 12,
            order: 3,
            color: '#87CEEB'
        },
        {
            ...baseProject,
            id: 'week',
            name: 'This Week',
            type: 19,
            deadline: 19,
            order: 4,
            color: '#9370DB'
        },
        {
            ...baseProject,
            id: 'planned',
            name: 'Planned',
            type: 20,
            deadline: 20,
            order: 5,
            color: '#20B2AA'
        },
        {
            ...baseProject,
            id: 'someday',
            name: 'Someday',
            type: 13,
            deadline: 13,
            order: 6,
            color: '#DDA0DD'
        },
        {
            ...baseProject,
            id: 'overdue',
            name: 'Overdue',
            type: 17,
            deadline: 17,
            order: 7,
            color: '#DC143C'
        },

        // ═══════════════════════════════════════════════════════════════════
        // UTILITY PROJECTS
        // ═══════════════════════════════════════════════════════════════════
        {
            ...baseProject,
            id: 'all',
            name: 'All',
            type: 15,
            deadline: 15,
            order: 8,
            color: '#4A90D9'
        },
        {
            ...baseProject,
            id: 'completed',
            name: 'Completed',
            type: 14,
            deadline: 14,
            order: 9,
            color: '#32CD32'
        },
        {
            ...baseProject,
            id: 'calendar',
            name: 'Calendar',
            type: 16,
            deadline: 16,
            order: 10,
            color: '#FF69B4'
        },
        {
            ...baseProject,
            id: 'search',
            name: 'Search',
            type: 18,
            deadline: 18,
            order: 11,
            color: '#808080'
        },

        // ═══════════════════════════════════════════════════════════════════
        // DEFAULT USER PROJECTS (Required for task assignment)
        // ═══════════════════════════════════════════════════════════════════
        {
            ...baseProject,
            id: '0',           // Legacy ID for default project
            name: 'Tasks',
            type: 0,
            deadline: 0,
            order: 100,
            color: '#4A90D9'
        },
        {
            ...baseProject,
            id: 'inbox',
            name: 'Inbox',
            type: 0,
            deadline: 0,
            order: 101,
            color: '#87CEEB'
        },
        {
            ...baseProject,
            id: 'default',
            name: 'Default',
            type: 0,
            deadline: 0,
            order: 102,
            color: '#98D8C8'
        },

        // ═══════════════════════════════════════════════════════════════════
        // SPECIAL VIEWS (Used by React components)
        // ═══════════════════════════════════════════════════════════════════
        {
            ...baseProject,
            id: 'myday',
            name: "Today's Tasks",
            type: 10,
            deadline: 10,
            order: 0,
            color: '#FF6B6B'
        },
        {
            ...baseProject,
            id: 'history',
            name: 'History',
            type: 14,
            deadline: 14,
            order: 200,
            color: '#A9A9A9'
        },
        {
            ...baseProject,
            id: 'upcoming',
            name: 'Upcoming',
            type: 20,
            deadline: 20,
            order: 201,
            color: '#20B2AA'
        },
        {
            ...baseProject,
            id: 'focus',
            name: 'Focus',
            type: 0,
            deadline: 0,
            order: 202,
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

})();
