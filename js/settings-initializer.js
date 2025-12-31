/**
 * SETTINGS INITIALIZER
 * 
 * Initializes pomodoro-settings with default values to fix 0m display
 * This ensures React has the configuration it needs for time calculations
 */

(function () {
    'use strict';

    console.log('[Settings Init] Initializing pomodoro settings...');

    // Check if settings already exist
    const existingSettings = localStorage.getItem('pomodoro-settings');
    const existingConfig = localStorage.getItem('pomodoro-config');

    // Default settings based on Focus To-Do standard
    const defaultSettings = {
        pomodoroInterval: 1500,      // 25 minutes in seconds
        shortBreakInterval: 300,     // 5 minutes in seconds
        longBreakInterval: 900,      // 15 minutes in seconds
        longBreakAfter: 4,           // Long break after 4 pomodoros
        autoStartBreak: false,
        autoStartPomodoro: false,
        tickingSound: false,
        alarmSound: true,
        volume: 50
    };

    const defaultConfig = {
        pomodoroLength: 25,          // 25 minutes
        shortBreak: 5,               // 5 minutes
        longBreak: 15,               // 15 minutes
        longBreakInterval: 4         // After 4 pomodoros
    };

    // Initialize if missing or empty
    if (!existingSettings || existingSettings === '{}' || existingSettings === 'null') {
        console.log('[Settings Init] Creating default pomodoro-settings...');
        localStorage.setItem('pomodoro-settings', JSON.stringify(defaultSettings));
        console.log('[Settings Init] ✅ Settings initialized:', defaultSettings);
    } else {
        console.log('[Settings Init] Settings already exist');
    }

    if (!existingConfig || existingConfig === '{}' || existingConfig === 'null') {
        console.log('[Settings Init] Creating default pomodoro-config...');
        localStorage.setItem('pomodoro-config', JSON.stringify(defaultConfig));
        console.log('[Settings Init] ✅ Config initialized:', defaultConfig);
    } else {
        console.log('[Settings Init] Config already exists');
    }

    // Dispatch storage event to trigger React update
    window.dispatchEvent(new StorageEvent('storage', {
        key: 'pomodoro-settings',
        newValue: localStorage.getItem('pomodoro-settings'),
        url: window.location.href,
        storageArea: localStorage
    }));

    window.dispatchEvent(new StorageEvent('storage', {
        key: 'pomodoro-config',
        newValue: localStorage.getItem('pomodoro-config'),
        url: window.location.href,
        storageArea: localStorage
    }));

    console.log('[Settings Init] ✅ Settings initialization complete');
})();
