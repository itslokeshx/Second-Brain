const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    id: { type: String, required: true },
    objType: { type: String, default: 'SUBTASK' },

    taskId: { type: String, required: true },

    name: { type: String, required: true },

    state: { type: Number, default: 0 },
    sync: { type: Number, default: 0 },

    isFinished: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },


    order: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },

    creationDate: { type: Number, default: () => Date.now() },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

subtaskSchema.index({ userId: 1, id: 1 }, { unique: true });
subtaskSchema.index({ userId: 1, taskId: 1 });

module.exports = mongoose.model('Subtask', subtaskSchema);
