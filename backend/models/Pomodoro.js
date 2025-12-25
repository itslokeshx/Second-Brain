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
    status: { type: String, default: 'completed' }, // completed, abandoned
    isManual: { type: Boolean, default: false },

    // Time tracking (for detailed logs)
    startTime: { type: Number, default: 0 },
    endTime: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },

    // Timestamps
    createdAt: { type: Date, default: Date.now }
});

pomodoroSchema.index({ userId: 1, id: 1 }, { unique: true });
pomodoroSchema.index({ userId: 1, taskId: 1 });

module.exports = mongoose.model('Pomodoro', pomodoroSchema);
