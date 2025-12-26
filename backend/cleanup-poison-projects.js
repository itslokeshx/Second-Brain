require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Project = require('./models/Project');

async function cleanupDB() {
    try {
        const uri = 'mongodb+srv://itslokeshx_db_user:MySecurePassword123@cluster0.toolnw5.mongodb.net/second-brain?retryWrites=true&w=majority&appName=Cluster0';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to MongoDB');

        const poisonIDs = ['inbox', 'default', 'myday', 'upcoming', 'focus'];

        // Get user ID first
        const users = await mongoose.connection.collection('users').find({ email: 'bittu@gmail.com' }).toArray();
        if (users.length === 0) {
            console.log('User not found');
            await mongoose.disconnect();
            return;
        }
        const userId = users[0]._id.toString();

        console.log(`Checking for poison projects for user ${userId}...`);

        const result = await Project.deleteMany({
            userId: userId,
            id: { $in: poisonIDs }
        });

        console.log(`Deleted ${result.deletedCount} poison projects.`);

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
        await mongoose.disconnect();
    }
}

cleanupDB();
