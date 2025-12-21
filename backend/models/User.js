const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: 'User' }, // Default prevents symbol bugs
    username: { type: String },
    projects: { type: Array, default: [] },
    tasks: { type: Array, default: [] },
    pomodoroLogs: { type: Array, default: [] },
    settings: { type: Object, default: {} },
    lastSyncTime: { type: Date, default: Date.now }
});

// Encrypt password
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Match password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
