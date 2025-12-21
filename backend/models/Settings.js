const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // User reference (one settings doc per user)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },

    // Settings data (matches localStorage schema)
    bgMusic: {
        type: String,
        default: ''
    },
    volume: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    timerSettings: {
        workDuration: {
            type: Number,
            default: 25
        },
        shortBreak: {
            type: Number,
            default: 5
        },
        longBreak: {
            type: Number,
            default: 15
        },
        autoStartBreaks: {
            type: Boolean,
            default: false
        },
        autoStartPomodoros: {
            type: Boolean,
            default: false
        },
        longBreakInterval: {
            type: Number,
            default: 4
        }
    },
    theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light'
    },
    notifications: {
        type: Boolean,
        default: true
    },
    soundEnabled: {
        type: Boolean,
        default: true
    },

    // Metadata
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Settings', settingsSchema);
