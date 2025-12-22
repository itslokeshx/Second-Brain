const mongoose = require('mongoose');

const pomodoroLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    id: {
        type: String,
        required: true
    },

    taskId: {
        type: String,
        required: true
    },
    startTime: {
        type: Number,
        required: true
    },
    endTime: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['completed', 'abandoned'],
        default: 'completed'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

pomodoroLogSchema.index({ userId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('PomodoroLog', pomodoroLogSchema);
