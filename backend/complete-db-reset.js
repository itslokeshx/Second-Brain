/**
 * Complete Database Cleanup and Recreation Script
 * ⚠️ WARNING: This will permanently delete ALL data!
 * 
 * Usage: node complete-db-reset.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function completeReset() {
    console.log('🚨 COMPLETE DATABASE RESET 🚨');
    console.log('━'.repeat(60));
    console.log('This will PERMANENTLY DELETE ALL DATA in your database!');
    console.log('━'.repeat(60));

    try {
        const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/second-brain';
        console.log(`\n📡 Connecting to database...`);

        await mongoose.connect(dbUri);
        console.log('✅ Connected to MongoDB');

        // Get database name
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

        // Create collections with proper schemas
        console.log('\n📝 Creating collections with schemas...');

        const User = require('./models/User');
        const Project = require('./models/Project');
        const Task = require('./models/Task');
        const PomodoroLog = require('./models/PomodoroLog');
        const Settings = require('./models/Settings');

        await User.createCollection();
        console.log('   ✓ users (user info only - NO nested arrays)');

        await Project.createCollection();
        console.log('   ✓ projects (separate collection with userId reference)');

        await Task.createCollection();
        console.log('   ✓ tasks (separate collection with userId reference)');

        await PomodoroLog.createCollection();
        console.log('   ✓ pomodorologs (separate collection with userId reference)');

        await Settings.createCollection();
        console.log('   ✓ settings (separate collection with userId reference)');

        console.log('\n✅ Collections recreated with proper schema');
        console.log('\n━'.repeat(60));
        console.log('✅ DATABASE RESET COMPLETE!');
        console.log('━'.repeat(60));
        console.log('\n📝 Next steps:');
        console.log('   1. Clear browser localStorage and cookies');
        console.log('      - Open DevTools (F12)');
        console.log('      - Application → Local Storage → Clear All');
        console.log('      - Application → Cookies → Clear All');
        console.log('   2. Restart your backend server (Ctrl+C then npm run dev)');
        console.log('   3. Open index.html in browser');
        console.log('   4. Register a new user (e.g., loki@gmail.com)');
        console.log('   5. Verify username displays correctly (not ��)');
        console.log('   6. Create some tasks/projects');
        console.log('   7. Click "Sync Now" button');
        console.log('   8. Check MongoDB - should see 5 collections with data\n');

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
completeReset();
