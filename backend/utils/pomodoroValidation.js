const validatePomodoroTimeData = (pomodoro) => {
    const errors = [];

    // Normalize status to lowercase
    const status = (pomodoro.status || 'todo').toLowerCase();

    switch (status) {
        case 'completed':
            if (!pomodoro.startTime || pomodoro.startTime <= 0) {
                errors.push('Completed Pomodoro must have a valid startTime greater than 0');
            }
            if (!pomodoro.endTime || pomodoro.endTime <= 0) {
                errors.push('Completed Pomodoro must have a valid endTime greater than 0');
            }
            if (pomodoro.endTime && pomodoro.startTime && pomodoro.endTime <= pomodoro.startTime) {
                errors.push('endTime must be after startTime');
            }

            const expectedDuration = (pomodoro.endTime || 0) - (pomodoro.startTime || 0);
            // Only check duration match if both times are valid
            if (pomodoro.endTime && pomodoro.startTime) {
                if (Math.abs((pomodoro.duration || 0) - expectedDuration) > 1000) { // Allow 1 second tolerance
                    errors.push(`duration (${pomodoro.duration}) does not match calculated duration (${expectedDuration})`);
                }
            }

            if ((pomodoro.duration || 0) <= 0) {
                errors.push('Completed Pomodoro must have duration greater than 0');
            }
            break;

        case 'active':
        case 'running':
            if (!pomodoro.startTime || pomodoro.startTime <= 0) {
                errors.push('Active Pomodoro must have a valid startTime greater than 0');
            }
            if (pomodoro.startTime > Date.now() + 60000) { // Allow 1 minute clock drift ahead
                errors.push('startTime cannot be in the future');
            }
            break;

        case 'paused':
            if (!pomodoro.startTime || pomodoro.startTime <= 0) {
                errors.push('Paused Pomodoro must have a valid startTime greater than 0');
            }
            break;

        // 'cancelled', 'todo', 'abandoned', or other statuses can have 0 values
        case 'cancelled':
        case 'todo':
        case 'abandoned':
            break;

        default:
            // Unknown status, maybe safe to ignore time validation but warn?
            // Treating as safe to save
            break;
    }

    return errors;
};

/**
 * ✅ FIREWALL MODE: Strict validation that throws on invalid data
 * Use this in sync endpoints to REJECT corrupt pomodoros before MongoDB write
 * 
 * @param {Object} pomodoro - Pomodoro object to validate
 * @throws {Error} If validation fails
 */
const rejectInvalidPomodoro = (pomodoro) => {
    const errors = validatePomodoroTimeData(pomodoro);

    if (errors.length > 0) {
        const errorMsg = `Invalid Pomodoro (id: ${pomodoro.id || 'unknown'}): ${errors.join(', ')}`;
        throw new Error(errorMsg);
    }
};

/**
 * ✅ Check if a pomodoro is corrupt (completed with zero timestamps)
 * This is the specific pattern that causes NaN cascades
 * 
 * @param {Object} pomodoro - Pomodoro object to check
 * @returns {boolean} True if corrupt
 */
const isCorruptPomodoro = (pomodoro) => {
    if (!pomodoro || pomodoro.status !== 'completed') {
        return false;
    }

    return (
        !pomodoro.startTime || pomodoro.startTime <= 0 ||
        !pomodoro.endTime || pomodoro.endTime <= 0 ||
        !pomodoro.duration || pomodoro.duration <= 0 ||
        pomodoro.endTime <= pomodoro.startTime
    );
};

module.exports = {
    validatePomodoroTimeData,
    rejectInvalidPomodoro,
    isCorruptPomodoro
};
