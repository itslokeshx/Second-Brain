const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    id: { type: String, required: true },
    objType: { type: String, default: 'SCHEDULE' },

    taskId: { type: String, default: '' },

    startTime: { type: Number, default: 0 },
    endTime: { type: Number, default: 0 },
    allDay: { type: Boolean, default: false },
    rrule: { type: String, default: '' },

    state: { type: Number, default: 0 },
    sync: { type: Number, default: 0 },
    deleted: { type: Boolean, default: false },
    creationDate: { type: Number, default: () => Date.now() },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

scheduleSchema.index({ userId: 1, id: 1 }, { unique: true });
scheduleSchema.index({ userId: 1, taskId: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
