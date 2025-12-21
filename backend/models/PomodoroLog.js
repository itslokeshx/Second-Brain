const mongoose = require('mongoose');

const pomodoroLogSchema = new mongoose.Schema({
    // User reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Original client-side ID (UUID from localStorage)
    id: {
        type: String,
        required: true
    },

    // Pomodoro data (matches localStorage schema)
    taskId: {
        type: String,
        required: true
    },
    startTime: {
        type: Number,  // Timestamp
        required: true
    },
    endTime: {
        type: Number,  // Timestamp
        required: true
    },
    duration: {
        type: Number,  // Minutes
        required: true
    },
    status: {
        type: String,
        enum: ['completed', 'abandoned'],
        default: 'completed'
    },

    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for user + client ID
pomodoroLogSchema.index({ userId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('PomodoroLog', pomodoroLogSchema);
