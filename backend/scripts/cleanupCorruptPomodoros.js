#!/usr/bin/env node
/**
 * ✅ DATABASE CLEANUP MIGRATION
 * 
 * Purpose: Clean up corrupt pomodoro records that were created before firewall protection
 * 
 * What it does:
 * 1. Finds all "completed" pomodoros with zero timestamps (startTime/endTime/duration <= 0)
 * 2. Marks them as "cancelled" (NEVER deletes - preserves history)
 * 3. Recalculates task statistics (actualPomoNum) based on valid pomodoros only
 * 4. Reports total records cleaned and tasks updated
 * 
 * Run: node backend/scripts/cleanupCorruptPomodoros.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Pomodoro = require('../models/Pomodoro');
const Task = require('../models/Task');

const cleanupCorruptPomodoros = async () => {
    try {
        console.log('🔍 Starting Corrupt Pomodoro Cleanup Migration...\n');

        // Connect to database
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI is not defined in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // ========================================
        // STEP 1: Find all corrupt pomodoros
        // ========================================
        console.log('📊 Searching for corrupt pomodoro records...');

        const corruptPomodoros = await Pomodoro.find({
            status: 'completed',
            $or: [
                { startTime: { $lte: 0 } },
                { endTime: { $lte: 0 } },
                { duration: { $lte: 0 } },
                { $expr: { $lte: ['$endTime', '$startTime'] } }
            ]
        });

        console.log(`\n🔎 Found ${corruptPomodoros.length} corrupt pomodoro records\n`);

        if (corruptPomodoros.length === 0) {
            console.log('✅ No corrupt records found. Database is clean!');
            await mongoose.connection.close();
            process.exit(0);
        }

        // ========================================
        // STEP 2: Mark corrupt records as cancelled
        // ========================================
        console.log('🔧 Marking corrupt records as cancelled...\n');

        const stats = {
            cancelled: 0,
            tasksUpdated: 0,
            affectedTasks: new Set()
        };

        for (const pomodoro of corruptPomodoros) {
            console.log(`  Processing Pomodoro ${pomodoro.id}:`);
            console.log(`    Current: status=${pomodoro.status}, start=${pomodoro.startTime}, end=${pomodoro.endTime}, duration=${pomodoro.duration}`);

            // Mark as cancelled (NEVER delete - preserve history)
            await Pomodoro.findByIdAndUpdate(pomodoro._id, {
                status: 'cancelled',
                startTime: 0,
                endTime: 0,
                duration: 0
            });

            stats.cancelled++;
            console.log(`    ✓ Marked as cancelled\n`);

            // Track affected tasks for statistics recalculation
            if (pomodoro.taskId) {
                stats.affectedTasks.add(pomodoro.taskId);
            }
        }

        // ========================================
        // STEP 3: Recalculate task statistics
        // ========================================
        console.log(`\n📈 Recalculating statistics for ${stats.affectedTasks.size} affected tasks...\n`);

        for (const taskId of stats.affectedTasks) {
            // Find the task
            const task = await Task.findOne({ id: taskId });

            if (!task) {
                console.log(`  ⚠️  Task ${taskId} not found (orphaned pomodoros)`);
                continue;
            }

            // Count ONLY valid completed pomodoros
            const validPomodorosCount = await Pomodoro.countDocuments({
                taskId: taskId,
                userId: task.userId,
                status: 'completed',
                startTime: { $gt: 0 },
                endTime: { $gt: 0 },
                duration: { $gt: 0 }
            });

            // Update task statistics
            await Task.findOneAndUpdate(
                { id: taskId, userId: task.userId },
                {
                    actualPomoNum: validPomodorosCount,
                    actPomodoros: validPomodorosCount
                }
            );

            stats.tasksUpdated++;
            console.log(`  ✓ Task ${taskId}: actualPomoNum updated to ${validPomodorosCount}`);
        }

        // ========================================
        // STEP 4: Verification
        // ========================================
        console.log('\n\n🔍 Verifying cleanup...');

        const remainingCorrupt = await Pomodoro.countDocuments({
            status: 'completed',
            $or: [
                { startTime: { $lte: 0 } },
                { endTime: { $lte: 0 } },
                { duration: { $lte: 0 } }
            ]
        });

        // ========================================
        // STEP 5: Final Report
        // ========================================
        console.log('\n' + '='.repeat(60));
        console.log('✅ MIGRATION COMPLETE');
        console.log('='.repeat(60));
        console.log(`\n📊 Summary:`);
        console.log(`   • Corrupt records found:    ${corruptPomodoros.length}`);
        console.log(`   • Records marked cancelled: ${stats.cancelled}`);
        console.log(`   • Tasks updated:            ${stats.tasksUpdated}`);
        console.log(`   • Remaining corrupt:        ${remainingCorrupt}`);

        if (remainingCorrupt > 0) {
            console.log('\n⚠️  WARNING: Some corrupt records still remain!');
            console.log('   This may indicate a validation bypass. Check logs above.');
        } else {
            console.log('\n✅ Database is now clean! No corrupt pomodoros remain.');
        }

        console.log('\n' + '='.repeat(60) + '\n');

        await mongoose.connection.close();
        console.log('👋 Disconnected from MongoDB\n');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
};

// Run migration
cleanupCorruptPomodoros();
