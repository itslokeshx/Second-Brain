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
    username: {
        type: String,
        required: true
    },
    // Alias for 'username' to match requested 'name' field behavior or just add virtual
    name: {
        type: String,
        default: function () { return this.username || this.email; }
    },
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
    },
    settings: {
        BgMusic: { type: String, default: '' },
        Volume: { type: Number, default: 50 },
        TimerSettings: { type: Object, default: {} }
    },
    // Embedded data for simple sync
    projects: [{
        id: String,
        name: String,
        color: String,
        order: Number,
        type: String, // 'project' or 'folder'
        parentId: String,
        estimatedTime: Number,
        spentTime: Number
    }],
    tasks: [{
        id: String,
        parentId: String,
        name: String,
        note: String,
        priority: Number,
        status: String,
        estimatedPomodoros: Number,
        actPomodoros: Number,
        dueDate: Date,
        createdTime: Number // Timestamp
    }],
    pomodoroLogs: [{
        id: String,
        taskId: String,
        startTime: Number,
        endTime: Number,
        duration: Number,
        status: String
    }]
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    // Only hash if not already hashed (bcrypt hashes start with $2a$ or $2b$)
    if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

module.exports = mongoose.model('User', userSchema);
