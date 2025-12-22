const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    // ✅ User reference - separate collection
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // ✅ Original ID from localStorage
    id: {
        type: String,
        required: true
    },

    // ✅ Project data matching localStorage schema exactly
    name: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#fd5553'
    },
    order: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ['folder', 'project'],
        default: 'project'
    },
    parentId: {
        type: String,
        default: ''
    },
    estimatedTime: {
        type: Number,
        default: 0
    },
    spentTime: {
        type: Number,
        default: 0
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// ✅ Compound index for fast queries
projectSchema.index({ userId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Project', projectSchema);
