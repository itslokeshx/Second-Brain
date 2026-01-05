const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    id: { type: String, required: true },
    objType: { type: String, default: 'PROJECT' },

    name: { type: String, required: true },
    color: { type: String, default: 'F4B357' },
    order: { type: Number, default: 0 },
    type: { type: Number, default: 0 },
    parentId: { type: String, default: '' },

    state: { type: Number, default: 0 },
    sync: { type: Number, default: 0 },

    isDefault: { type: Boolean, default: false },
    orderingRule: { type: Number, default: 0 },
    imageName: { type: String, default: '' },
    expanded: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    closed: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },

    estimatedTime: { type: Number, default: 0 },
    spentTime: { type: Number, default: 0 },

    creationDate: { type: Number, default: () => Date.now() },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

projectSchema.index({ userId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Project', projectSchema);
