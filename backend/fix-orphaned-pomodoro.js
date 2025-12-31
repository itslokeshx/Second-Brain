/**
 * Fix orphaned pomodoro (missing taskId)
 * Links pomodoro 26E2247D to the same task as 902D289B since they were created at the same time
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Pomodoro = require('./models/Pomodoro');

async function fixOrphanedPomodoro() {
    try {
        console.log('🔧 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find the orphaned pomodoro
        const orphaned = await Pomodoro.findOne({ id: '26E2247D-E0A5-4E4B-8F4F-85F151E55131' });

        if (!orphaned) {
            console.log('❌ Orphaned pomodoro not found');
            process.exit(1);
        }

        console.log(`📊 Found orphaned pomodoro:`);
        console.log(`   ID: ${orphaned.id}`);
        console.log(`   taskId: "${orphaned.taskId}" (empty)`);
        console.log(`   startTime: ${orphaned.startTime}`);

        // Find the sibling pomodoro (created at almost the same time)
        const sibling = await Pomodoro.findOne({ id: '902D289B-8F15-42B0-8E3D-6B670F570786' });

        if (!sibling || !sibling.taskId) {
            console.log('❌ Could not find sibling pomodoro with taskId');
            process.exit(1);
        }

        console.log(`\n📊 Found sibling pomodoro:`);
        console.log(`   ID: ${sibling.id}`);
        console.log(`   taskId: ${sibling.taskId}`);
        console.log(`   startTime: ${sibling.startTime}`);

        // Link orphaned pomodoro to the same task
        console.log(`\n✅ Linking orphaned pomodoro to task: ${sibling.taskId}`);

        await Pomodoro.updateOne(
            { _id: orphaned._id },
            {
                $set: {
                    taskId: sibling.taskId,
                    sync: 0 // Mark as dirty so it re-syncs
                }
            }
        );

        console.log('✅ Fixed orphaned pomodoro!');
        console.log('💡 It will re-sync to clients on next sync');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the fix
fixOrphanedPomodoro();
