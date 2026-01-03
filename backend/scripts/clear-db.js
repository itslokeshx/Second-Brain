/**
 * Clear Database Collections Script
 * Drops all data but keeps collections
 * Run with: node scripts/clear-db.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function clearDB() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        // Import models
        const User = require('../models/User');
        const Project = require('../models/Project');
        const Task = require('../models/Task');
        const Pomodoro = require('../models/Pomodoro');
        const Subtask = require('../models/Subtask');
        const Schedule = require('../models/Schedule');
        const Settings = require('../models/Settings');

        // Clear all collections
        const results = await Promise.all([
            User.deleteMany({}),
            Project.deleteMany({}),
            Task.deleteMany({}),
            Pomodoro.deleteMany({}),
            Subtask.deleteMany({}),
            Schedule.deleteMany({}),
            Settings.deleteMany({})
        ]);

        console.log('✅ All collections cleared');
        console.log('   Users deleted:', results[0].deletedCount);
        console.log('   Projects deleted:', results[1].deletedCount);
        console.log('   Tasks deleted:', results[2].deletedCount);
        console.log('   Pomodoros deleted:', results[3].deletedCount);
        console.log('   Subtasks deleted:', results[4].deletedCount);
        console.log('   Schedules deleted:', results[5].deletedCount);
        console.log('   Settings deleted:', results[6].deletedCount);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected');
        process.exit(0);
    }
}

clearDB();
