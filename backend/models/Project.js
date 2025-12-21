const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
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

    // Project data (matches localStorage schema)
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

    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    },
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
projectSchema.index({ userId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Project', projectSchema);
