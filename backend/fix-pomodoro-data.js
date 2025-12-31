/**
 * Fix corrupted pomodoro data in MongoDB
 * This script repairs pomodoros that have startTime but missing endTime/duration
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Pomodoro = require('./models/Pomodoro');

async function fixPomodoroData() {
    try {
        console.log('🔧 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all pomodoros with missing endTime but have startTime
        const corruptedPomos = await Pomodoro.find({
            startTime: { $gt: 0 },
            $or: [
                { endTime: 0 },
                { endTime: { $exists: false } },
                { duration: 0 },
                { duration: { $exists: false } }
            ]
        });

        console.log(`📊 Found ${corruptedPomos.length} corrupted pomodoros\n`);

        if (corruptedPomos.length === 0) {
            console.log('✅ No corrupted pomodoros found!');
            process.exit(0);
        }

        let fixed = 0;
        const STANDARD_POMODORO_MS = 25 * 60 * 1000; // 25 minutes

        for (const pomo of corruptedPomos) {
            console.log(`\n🔍 Pomodoro ${pomo.id.substring(0, 8)}:`);
            console.log(`   startTime: ${pomo.startTime}`);
            console.log(`   endTime: ${pomo.endTime}`);
            console.log(`   duration: ${pomo.duration}`);
            console.log(`   taskId: ${pomo.taskId || 'MISSING'}`);

            // Calculate endTime and duration
            const endTime = pomo.endTime || (pomo.startTime + STANDARD_POMODORO_MS);
            const duration = endTime - pomo.startTime;

            console.log(`   ✅ Fixing: endTime=${endTime}, duration=${duration}ms (${Math.floor(duration / 1000 / 60)}min)`);

            // Update the pomodoro
            await Pomodoro.updateOne(
                { _id: pomo._id },
                {
                    $set: {
                        endTime: endTime,
                        duration: duration,
                        sync: 0 // Mark as dirty so it re-syncs to clients
                    }
                }
            );

            fixed++;
        }

        console.log(`\n\n✅ Fixed ${fixed} pomodoros!`);
        console.log('💡 These will re-sync to clients on next sync');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the fix
fixPomodoroData();
