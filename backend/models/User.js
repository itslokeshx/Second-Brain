const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    // ✅ CRITICAL: Simple string, no encoding issues
    name: {
        type: String,
        required: true,
        default: function () {
            return this.email.split('@')[0];
        }
    },
    // ❌ REMOVED: Don't store data in user document
    // projects: Array,
    // tasks: Array,
    // pomodoroLogs: Array,
    // settings: Object,

    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    lastSyncTime: {
        type: Date,
        default: null
    }
});

// Encrypt password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
