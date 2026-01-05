const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },

    BgMusic: {
        type: String,
        default: ''
    },
    Volume: {
        type: Number,
        default: 50
    },
    TimerSettings: {
        type: Object,
        default: {}
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Settings', settingsSchema);
