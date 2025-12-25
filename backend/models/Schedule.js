const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    // User reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Original ID from IndexedDB
    id: { type: String, required: true },
    objType: { type: String, default: 'SCHEDULE' },

    // Task reference
    taskId: { type: String, default: '' },

    // Schedule details
    startTime: { type: Number, default: 0 },
    endTime: { type: Number, default: 0 },
    allDay: { type: Boolean, default: false },

    // Recurring
    rrule: { type: String, default: '' },

    // State & Sync
    state: { type: Number, default: 0 },
    sync: { type: Number, default: 0 },
    deleted: { type: Boolean, default: false },

    // Timestamps
    creationDate: { type: Number, default: () => Date.now() },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

scheduleSchema.index({ userId: 1, id: 1 }, { unique: true });
scheduleSchema.index({ userId: 1, taskId: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
