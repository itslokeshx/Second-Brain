const mongoose = require('mongoose');


mongoose.connect('mongodb://localhost:27017/second-brain')
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // Update the task to assign it to inbox
        const result = await mongoose.connection.db.collection('tasks').updateOne(
            { id: '5B00A8D8-1241-4431-8F04-D90B9AADD774' },
            { $set: { projectId: 'inbox' } }
        );

        console.log('Update result:', result);

        if (result.modifiedCount > 0) {
            console.log('✅ Task updated! projectId set to "inbox"');
        } else {
            console.log('⚠️ No task was modified');
        }

        // Verify the update
        const task = await mongoose.connection.db.collection('tasks').findOne(
            { id: '5B00A8D8-1241-4431-8F04-D90B9AADD774' }
        );

        console.log('\nUpdated task:', {
            id: task.id,
            name: task.name,
            projectId: task.projectId
        });

        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
