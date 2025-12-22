/**
 * Database Cleanup Script
 * Completely deletes the MongoDB database and recreates it fresh
 * 
 * ⚠️ WARNING: This will permanently delete ALL data!
 * 
 * Usage: node clear-db.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function deleteAndRecreateDatabase() {
    console.log('🚨 DATABASE DELETION SCRIPT 🚨');
    console.log('━'.repeat(50));
    console.log('This will PERMANENTLY DELETE ALL DATA in your database!');
    console.log('━'.repeat(50));

    try {
        const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/second-brain';
        console.log(`\n📡 Connecting to: ${dbUri.replace(/\/\/.*@/, '//***@')}`);

        await mongoose.connect(dbUri);
        console.log('✅ Connected to MongoDB');

        // Get database name from connection
        const dbName = mongoose.connection.db.databaseName;
        console.log(`📦 Database: ${dbName}`);

        // List collections before deletion
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`\n📋 Collections to be deleted (${collections.length}):`);
        collections.forEach(col => console.log(`   - ${col.name}`));

        // Drop entire database
        console.log('\n🗑️  Dropping database...');
        await mongoose.connection.dropDatabase();
        console.log('✅ Database completely deleted');

        // Reconnect to recreate database
        console.log('\n🔄 Reconnecting...');
        await mongoose.disconnect();
        await mongoose.connect(dbUri);
        console.log('✅ Database recreated (empty)');

        // Create collections with models to ensure indexes
        console.log('\n📝 Creating collections with schemas...');

        const User = require('./models/User');
        const Project = require('./models/Project');
        const Task = require('./models/Task');
        const PomodoroLog = require('./models/PomodoroLog');
        const Settings = require('./models/Settings');

        await User.createCollection();
        console.log('   ✓ users');

        await Project.createCollection();
        console.log('   ✓ projects');

        await Task.createCollection();
        console.log('   ✓ tasks');

        await PomodoroLog.createCollection();
        console.log('   ✓ pomodorologs');

        await Settings.createCollection();
        console.log('   ✓ settings');

        console.log('\n✅ Collections recreated with proper schema');
        console.log('\n━'.repeat(50));
        console.log('✅ DATABASE CLEANUP COMPLETE!');
        console.log('━'.repeat(50));
        console.log('\n📝 Next steps:');
        console.log('   1. Clear browser localStorage and cookies');
        console.log('   2. Restart your backend server');
        console.log('   3. Register a new user to test');
        console.log('   4. Verify username displays correctly');
        console.log('   5. Test sync button functionality\n');

        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the script
deleteAndRecreateDatabase();
