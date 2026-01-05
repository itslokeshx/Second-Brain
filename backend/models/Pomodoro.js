const mongoose = require('mongoose');

const pomodoroSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    id: { type: String, required: true },
    objType: { type: String, default: 'POMODORO' },

    creationDate: { type: Number, required: true },
    endDate: { type: Number, required: true },
    interval: { type: Number, required: true },
    pomodoroInterval: { type: Number, required: true },

    state: { type: Number, required: true },
    isManual: { type: Boolean, default: false },

    taskId: { type: String, required: true },
    subtaskId: { type: String, default: '' },

    sync: { type: Number, default: 1 }
});

pomodoroSchema.pre('save', function (next) {
    const forbiddenFields = ['startTime', 'endTime', 'duration', 'status', 'createdAt'];
    const hasForbidden = forbiddenFields.some(field => this[field] !== undefined);

    if (hasForbidden) {
        return next(new Error('Invalid Pomodoro schema: forbidden fields detected (startTime/endTime/duration/status). Use creationDate/endDate/interval/pomodoroInterval instead.'));
    }

    next();
});


pomodoroSchema.index({ userId: 1, id: 1 }, { unique: true });
pomodoroSchema.index({ userId: 1, taskId: 1 });

module.exports = mongoose.model('Pomodoro', pomodoroSchema);
