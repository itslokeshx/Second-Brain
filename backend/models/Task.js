const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    // User reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Original ID from IndexedDB
    id: { type: String, required: true },
    objType: { type: String, default: 'TASK' },

    // Core fields
    name: { type: String, required: true },
    projectId: { type: String, default: '' },
    parentId: { type: String, default: '' }, // For sub-task hierarchy

    // State & Sync
    state: { type: Number, default: 0 },
    sync: { type: Number, default: 0 },

    // Status
    status: { type: String, default: 'todo' },
    isFinished: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    finishedDate: { type: Number, default: 0 },

    // Priority & Order
    priority: { type: Number, default: 0 }, // 0=none, 1=low, 2=medium, 3=high
    order: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },

    // Pomodoro
    estimatePomoNum: { type: Number, default: 0 },
    actualPomoNum: { type: Number, default: 0 },
    estimatedPomodoros: { type: Number, default: 0 }, // Alias
    actPomodoros: { type: Number, default: 0 }, // Alias
    pomodoroInterval: { type: Number, default: 1500 },

    // Deadline & Reminders
    deadline: { type: Number, default: 0 },
    dueDate: { type: mongoose.Schema.Types.Mixed, default: null },
    reminderDate: { type: Number, default: 0 },
    reminders: { type: String, default: '' },

    // Recurring task fields
    rCycle: { type: Number, default: 0 },
    rFirstDeadline: { type: Number, default: 0 },
    rUnit: { type: String, default: '' },
    rValue: { type: String, default: '' },
    rId: { type: String, default: '' },
    rStartDate: { type: Number, default: 0 },
    rEndDate: { type: Number, default: 0 },

    // Notes & Tags
    note: { type: String, default: '' },
    remark: { type: String, default: '' },
    tags: { type: String, default: '' },

    // UI State
    hasSubtask: { type: Boolean, default: false },
    isExpanded: { type: Boolean, default: false },

    // Timestamps
    creationDate: { type: Number, default: () => Date.now() },
    createdTime: { type: Number, default: () => Date.now() },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

taskSchema.index({ userId: 1, id: 1 }, { unique: true });
taskSchema.index({ userId: 1, projectId: 1 });

module.exports = mongoose.model('Task', taskSchema);
