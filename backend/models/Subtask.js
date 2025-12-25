const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
    // User reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Original ID from IndexedDB
    id: { type: String, required: true },
    objType: { type: String, default: 'SUBTASK' },

    // Parent task reference
    taskId: { type: String, required: true },

    // Core fields
    name: { type: String, required: true },

    // State & Sync
    state: { type: Number, default: 0 },
    sync: { type: Number, default: 0 },

    // Status
    isFinished: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },

    // Order
    order: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },

    // Timestamps
    creationDate: { type: Number, default: () => Date.now() },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

subtaskSchema.index({ userId: 1, id: 1 }, { unique: true });
subtaskSchema.index({ userId: 1, taskId: 1 });

module.exports = mongoose.model('Subtask', subtaskSchema);
