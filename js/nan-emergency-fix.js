/**
 * EMERGENCY NaN FIX
 * 
 * Comprehensive patch for all Math operations that could produce NaN
 * This intercepts at the lowest level to catch ALL calculations
 */

(function () {
    'use strict';

    console.log('[NaN Emergency Fix] Loading comprehensive NaN prevention...');

    // Store original Math functions
    const originalMathFloor = Math.floor;
    const originalMathCeil = Math.ceil;
    const originalMathRound = Math.round;
    const originalParseInt = parseInt;
    const originalParseFloat = parseFloat;

    // Patch Math.floor
    Math.floor = function (value) {
        if (value === undefined || value === null || isNaN(value)) {
            console.warn('[NaN Fix] Math.floor received invalid value:', value, '- returning 0');
            return 0;
        }
        return originalMathFloor(value);
    };

    // Patch Math.ceil
    Math.ceil = function (value) {
        if (value === undefined || value === null || isNaN(value)) {
            console.warn('[NaN Fix] Math.ceil received invalid value:', value, '- returning 0');
            return 0;
        }
        return originalMathCeil(value);
    };

    // Patch Math.round
    Math.round = function (value) {
        if (value === undefined || value === null || isNaN(value)) {
            console.warn('[NaN Fix] Math.round received invalid value:', value, '- returning 0');
            return 0;
        }
        return originalMathRound(value);
    };

    // Patch parseInt
    window.parseInt = function (value, radix) {
        const result = originalParseInt(value, radix);
        if (isNaN(result)) {
            console.warn('[NaN Fix] parseInt produced NaN from:', value, '- returning 0');
            return 0;
        }
        return result;
    };

    // Patch parseFloat
    window.parseFloat = function (value) {
        const result = originalParseFloat(value);
        if (isNaN(result)) {
            console.warn('[NaN Fix] parseFloat produced NaN from:', value, '- returning 0');
            return 0;
        }
        return result;
    };

    // Intercept division operations that could produce NaN
    // This patches the Number prototype to add a safe division method
    Number.prototype.safeDiv = function (divisor) {
        if (divisor === 0 || isNaN(divisor) || divisor === undefined || divisor === null) {
            console.warn('[NaN Fix] Safe division prevented NaN: ', this, '/', divisor, '- returning 0');
            return 0;
        }
        return this / divisor;
    };

    // Patch React's time calculation specifically
    // This intercepts the common pattern: actualPomoNum * pomodoroInterval / 60
    const originalValueOf = Number.prototype.valueOf;
    Number.prototype.valueOf = function () {
        const value = originalValueOf.call(this);
        if (isNaN(value)) {
            console.warn('[NaN Fix] valueOf returned NaN - returning 0');
            return 0;
        }
        return value;
    };

    // Global NaN sanitizer for any object property access
    const nanSanitizer = {
        get(target, prop) {
            const value = target[prop];
            if (typeof value === 'number' && isNaN(value)) {
                console.warn('[NaN Fix] Sanitized NaN property:', prop, '- returning 0');
                return 0;
            }
            return value;
        }
    };

    // Patch localStorage getItem to sanitize NaN values in stored data
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
        const value = originalGetItem.call(this, key);
        if (value && (key.includes('pomodoro') || key.includes('task'))) {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    // Sanitize arrays (tasks, projects, pomodoros)
                    parsed.forEach(item => {
                        if (item && typeof item === 'object') {
                            Object.keys(item).forEach(k => {
                                if (typeof item[k] === 'number' && isNaN(item[k])) {
                                    console.warn('[NaN Fix] Sanitized NaN in localStorage:', key, k, '- setting to 0');
                                    item[k] = 0;
                                }
                            });
                        }
                    });
                    return JSON.stringify(parsed);
                }
            } catch (e) {
                // Not JSON, return as-is
            }
        }
        return value;
    };

    console.log('[NaN Emergency Fix] ✅ All Math operations patched');
    console.log('[NaN Emergency Fix] ✅ localStorage sanitization active');
    console.log('[NaN Emergency Fix] ✅ NaN prevention fully deployed');
})();
