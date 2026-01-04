require('dotenv').config({ path: '../.env' }); // Adjust if run from scripts dir
const mongoose = require('mongoose');
const Pomodoro = require('../models/Pomodoro');
const Task = require('../models/Task');

const fixCorruptPomodoros = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        // Find all corrupt "completed" Pomodoros
        const corruptPomodoros = await Pomodoro.find({
            status: 'completed',
            $or: [
                { startTime: { $lte: 0 } },
                { endTime: { $lte: 0 } },
                { duration: { $lte: 0 } },
                { $expr: { $lte: ['$endTime', '$startTime'] } }
            ]
        });

        console.log(`Found ${corruptPomodoros.length} corrupt Pomodoro records`);

        const fixes = {
            deleted: 0,
            updated: 0,
            taskUpdates: 0
        };

        for (const pomodoro of corruptPomodoros) {
            console.log(`\nProcessing corrupt Pomodoro: ${pomodoro.id}`);
            console.log(`  Current data: startTime=${pomodoro.startTime}, endTime=${pomodoro.endTime}, duration=${pomodoro.duration}`);

            // Attempt to fix calculation if startTime and endTime seem somewhat reasonable (both > 0)
            if (pomodoro.startTime > 0 && pomodoro.endTime > 0 && pomodoro.endTime > pomodoro.startTime) {
                const calcDuration = pomodoro.endTime - pomodoro.startTime;
                await Pomodoro.findByIdAndUpdate(pomodoro._id, {
                    duration: calcDuration
                });
                fixes.updated++;
                console.log(`  ✓ Fixed duration to ${calcDuration}`);
            } else {
                // If critical time data is missing/invalid, mark as cancelled and zero out
                await Pomodoro.findByIdAndUpdate(pomodoro._id, {
                    status: 'cancelled',
                    startTime: 0,
                    endTime: 0,
                    duration: 0
                });
                fixes.updated++;
                console.log(`  ✓ Updated to cancelled status (invalid times)`);
            }

            // Update associated task if exists
            if (pomodoro.taskId) {
                // We need to find the task first to check if it exists
                // Note: Task.findOne({ id: ... }) assuming 'id' is the custom ID field, not _id
                const task = await Task.findOne({ id: pomodoro.taskId, userId: pomodoro.userId });

                if (task) {
                    // Recalculate actualPomoNum by counting valid completed pomodoros
                    const validPomodorosCount = await Pomodoro.countDocuments({
                        taskId: pomodoro.taskId,
                        userId: pomodoro.userId,
                        status: 'completed',
                        startTime: { $gt: 0 },
                        endTime: { $gt: 0 },
                        duration: { $gt: 0 }
                    });

                    // Also recalculate total time if needed, but user asked for actualPomoNum
                    // User request code: actualPomoNum: validPomodoros, actPomodoros: validPomodoros

                    await Task.findOneAndUpdate(
                        { id: pomodoro.taskId, userId: pomodoro.userId },
                        {
                            actualPomoNum: validPomodorosCount,
                            actPomodoros: validPomodorosCount
                        }
                    );

                    fixes.taskUpdates++;
                    console.log(`  ✓ Updated task ${pomodoro.taskId} actualPomoNum to ${validPomodorosCount}`);
                }
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log(`Total records updated: ${fixes.updated}`);
        console.log(`Total records deleted: ${fixes.deleted}`);
        console.log(`Total tasks updated: ${fixes.taskUpdates}`);

        // Verify no corrupt records remain
        const remainingCorrupt = await Pomodoro.countDocuments({
            status: 'completed',
            $or: [
                { startTime: { $lte: 0 } },
                { endTime: { $lte: 0 } },
                { duration: { $lte: 0 } }
            ]
        });

        console.log(`\nRemaining corrupt records: ${remainingCorrupt}`);

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

fixCorruptPomodoros();
