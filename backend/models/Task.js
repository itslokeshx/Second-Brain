const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
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

    // ✅ Matches localStorage schema exactly
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
        default: 0
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
        type: String,
        default: null
    },
    createdTime: {
        type: Number,
        required: true
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

taskSchema.index({ userId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Task', taskSchema);
