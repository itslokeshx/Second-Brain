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

    // Core timing fields (MUST match IndexedDB exactly)
    creationDate: { type: Number, required: true },
    endDate: { type: Number, required: true },
    interval: { type: Number, required: true },
    pomodoroInterval: { type: Number, required: true },

    // State & Status
    state: { type: Number, required: true },
    isManual: { type: Boolean, default: false },

    // References
    taskId: { type: String, required: true },
    subtaskId: { type: String, default: '' },

    // Sync
    sync: { type: Number, default: 1 }
});

// Validation: Reject payloads with forbidden fields
pomodoroSchema.pre('save', function (next) {
    // Check for forbidden fields from old schema
    const forbiddenFields = ['startTime', 'endTime', 'duration', 'status', 'createdAt'];
    const hasForbidden = forbiddenFields.some(field => this[field] !== undefined);

    if (hasForbidden) {
        return next(new Error('Invalid Pomodoro schema: forbidden fields detected (startTime/endTime/duration/status). Use creationDate/endDate/interval/pomodoroInterval instead.'));
    }

    next();
});

// Indexes
pomodoroSchema.index({ userId: 1, id: 1 }, { unique: true });
pomodoroSchema.index({ userId: 1, taskId: 1 });

module.exports = mongoose.model('Pomodoro', pomodoroSchema);
