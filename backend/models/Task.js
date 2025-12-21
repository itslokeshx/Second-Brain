const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
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

    // Task data (matches localStorage schema)
    parentId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    note: {
        type: String,
        default: ''
    },
    priority: {
        type: Number,
        min: 0,
        max: 3,
        default: 0  // 0=None, 1=Low, 2=Medium, 3=High
    },
    status: {
        type: String,
        enum: ['todo', 'done'],
        default: 'todo'
    },
    estimatedPomodoros: {
        type: Number,
        default: 0
    },
    actPomodoros: {
        type: Number,
        default: 0
    },
    dueDate: {
        type: String,  // ISO8601 string or null
        default: null
    },
    createdTime: {
        type: Number,  // Timestamp
        required: true
    },

    // Metadata
    updatedAt: {
        type: Date,
        default: Date.now
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
});

// Compound index for user + client ID
taskSchema.index({ userId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Task', taskSchema);
