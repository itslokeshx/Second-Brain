/**
 * Complete Database Reset Script
 * Drops all collections and recreates them with new schema
 * Run with: node scripts/reset-database.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function resetDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log(`📦 Found ${collections.length} collections`);

        // Drop each collection
        for (const collection of collections) {
            console.log(`🗑️  Dropping collection: ${collection.name}`);
            await db.dropCollection(collection.name);
        }

        console.log('✅ All collections dropped successfully!');
        console.log('');
        console.log('🔧 New schema models available:');
        console.log('   - Project (with full IndexedDB fields)');
        console.log('   - Task (with recurring, reminders, pomodoro fields)');
        console.log('   - Pomodoro (session tracking)');
        console.log('   - Subtask (task sub-items)');
        console.log('   - Schedule (calendar events)');
        console.log('   - User (authentication)');
        console.log('   - Settings (user preferences)');
        console.log('');
        console.log('🚀 Restart your backend server to apply new schemas!');

    } catch (error) {
        console.error('❌ Error resetting database:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

resetDatabase();
