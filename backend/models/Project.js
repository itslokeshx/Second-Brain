const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    // User reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Original ID from IndexedDB
    id: { type: String, required: true },
    objType: { type: String, default: 'PROJECT' },

    // Core fields
    name: { type: String, required: true },
    color: { type: String, default: 'F4B357' },
    order: { type: Number, default: 0 },
    type: { type: String, default: '0' }, // "0" = folder, "1000" = project, "4xxx" = smart filters
    parentId: { type: String, default: '' },

    // State & Sync
    state: { type: Number, default: 0 },
    sync: { type: Number, default: 0 },

    // Settings
    isDefault: { type: Boolean, default: false },
    orderingRule: { type: Number, default: 0 },
    imageName: { type: String, default: '' },
    expanded: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    closed: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },

    // Time tracking
    estimatedTime: { type: Number, default: 0 },
    spentTime: { type: Number, default: 0 },

    // Timestamps
    creationDate: { type: Number, default: () => Date.now() },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

projectSchema.index({ userId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Project', projectSchema);
