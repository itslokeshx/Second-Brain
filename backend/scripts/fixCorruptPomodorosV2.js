require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Define schema inline to avoid external Dependencies issues/mismatches
const pomodoroSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    id: String,
    status: String,
    startTime: Number,
    endTime: Number,
    duration: Number,
    taskId: String
}, { strict: false }); // Strict false to read whatever is there

const fixCorruptPomodorosV2 = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in DB:', collections.map(c => c.name));

        // Try both likely collection names
        const collectionNames = ['pomodoros', 'pomodorologs', 'Pomodoros'];

        for (const colName of collectionNames) {
            // Check if collection exists
            if (!collections.find(c => c.name === colName)) continue;

            console.log(`\nScanning collection: ${colName}`);
            const Model = mongoose.model(colName, pomodoroSchema, colName);

            // 1. Search for specific ID user reported
            const specificId = "5DE6308E-E6B3-44D5-A16C-7F0ED9C3B442";
            const specificRecord = await Model.findOne({ id: specificId });
            if (specificRecord) {
                console.log(`FOUND Reported Record: ${specificRecord.id}`);
                console.log('  Data:', JSON.stringify(specificRecord.toJSON(), null, 2));

                if (specificRecord.status === 'completed' && specificRecord.duration === 0) {
                    console.log('  -> Record IS corrupt. Fixing...');
                    await Model.updateOne({ _id: specificRecord._id }, {
                        $set: { status: 'cancelled', startTime: 0, endTime: 0, duration: 0 }
                    });
                    console.log('  -> Marked as cancelled.');
                }
            } else {
                console.log(`Did NOT find reported record ${specificId} in ${colName}`);
            }

            // 2. Search for all corrupt "completed" records
            const corrupt = await Model.find({
                status: 'completed',
                $or: [
                    { startTime: { $lte: 0 } },
                    { endTime: { $lte: 0 } },
                    { duration: { $lte: 0 } }
                ]
            });

            console.log(`Found ${corrupt.length} total corrupt records in ${colName}`);

            for (const p of corrupt) {
                console.log(`  Fixing ${p.id} (Status: ${p.status}, Duration: ${p.duration})`);
                await Model.updateOne({ _id: p._id }, {
                    $set: { status: 'cancelled', startTime: 0, endTime: 0, duration: 0 }
                });

                // Fix Task stats if needed
                if (p.taskId && p.userId) {
                    const TaskModel = mongoose.model('Task', new mongoose.Schema({}, { strict: false }), 'tasks');
                    // Recalculate usage
                    const validCount = await Model.countDocuments({
                        taskId: p.taskId,
                        userId: p.userId,
                        status: 'completed',
                        duration: { $gt: 0 }
                    });

                    await TaskModel.updateOne(
                        { id: p.taskId, userId: p.userId },
                        { $set: { actualPomoNum: validCount, actPomodoros: validCount } }
                    );
                    console.log(`    -> Updated Task ${p.taskId} count to ${validCount}`);
                }
            }
        }

        console.log('\nMigration V2 Complete');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

fixCorruptPomodorosV2();
