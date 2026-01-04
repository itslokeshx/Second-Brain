const mongoose = require('mongoose');

const pomodoroSchema = new mongoose.Schema({
    // User reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Original ID from IndexedDB
    id: { type: String, required: true },
    objType: { type: String, default: 'POMODORO' },

    // References
    taskId: { type: String, default: '' },
    subtaskId: { type: String, default: '' },

    // State & Sync
    state: { type: Number, default: 0 },
    sync: { type: Number, default: 0 },

    // Status
    status: {
        type: String,
        default: 'completed', // completed, abandoned, etc.
        enum: ['todo', 'active', 'running', 'paused', 'completed', 'cancelled', 'abandoned']
    },
    isManual: { type: Boolean, default: false },

    // Time tracking (for detailed logs)
    startTime: {
        type: Number,
        default: 0,
        validate: {
            validator: function (value) {
                if (['completed', 'active', 'running', 'paused'].includes(this.status)) {
                    return value > 0;
                }
                return true;
            },
            message: 'startTime must be greater than 0 for completed, active, or paused Pomodoros'
        }
    },
    endTime: {
        type: Number,
        default: 0,
        validate: {
            validator: function (value) {
                if (this.status === 'completed') {
                    return value > 0 && value > this.startTime;
                }
                return true;
            },
            message: 'endTime must be greater than 0 and after startTime for completed Pomodoros'
        }
    },
    duration: {
        type: Number,
        default: 0,
        validate: {
            validator: function (value) {
                if (this.status === 'completed') {
                    return value > 0;
                }
                return true;
            },
            message: 'duration must be greater than 0 for completed Pomodoros'
        }
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now }
});

// Add pre-save hook for additional validation and logic
pomodoroSchema.pre('save', function (next) {
    if (this.status === 'completed') {
        // Validation check for start/end time presence
        if (!this.startTime || this.startTime === 0) {
            return next(new Error('Cannot save completed Pomodoro without valid startTime'));
        }
        if (!this.endTime || this.endTime === 0) {
            return next(new Error('Cannot save completed Pomodoro without valid endTime'));
        }
        if (this.endTime <= this.startTime) {
            return next(new Error('Cannot save completed Pomodoro where endTime is before or equal to startTime'));
        }

        // Auto-calculate duration if not set correctly (with 1s tolerance)
        const calculatedDuration = this.endTime - this.startTime;
        if (Math.abs(this.duration - calculatedDuration) > 1000) {
            this.duration = calculatedDuration;
        }

        // Just to be safe, if duration is still invalid even after calc attempt (e.g. if start/end were weirdly close? though endTime > startTime check handles that mostly)
        if (this.duration <= 0) {
            return next(new Error('Calculated duration must be greater than 0'));
        }
    }

    next();
});

pomodoroSchema.index({ userId: 1, id: 1 }, { unique: true });
pomodoroSchema.index({ userId: 1, taskId: 1 });

module.exports = mongoose.model('Pomodoro', pomodoroSchema);
