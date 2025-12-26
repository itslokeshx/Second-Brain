require('dotenv').config({ path: '../.env' }); // Adjust path if needed or just rely on default
const mongoose = require('mongoose');
const Project = require('./models/Project');

async function dumpDB() {
    try {
        const uri = 'mongodb+srv://itslokeshx_db_user:MySecurePassword123@cluster0.toolnw5.mongodb.net/second-brain?retryWrites=true&w=majority&appName=Cluster0';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to MongoDB');

        // user ID from previous logs: 694e9a642a49d2ad8f8afeec
        // but let's query by email to be sure
        const users = await mongoose.connection.collection('users').find({ email: 'bittu@gmail.com' }).toArray();

        if (users.length === 0) {
            console.log('User not found');
            return;
        }

        const userId = users[0]._id.toString();
        console.log('User ID:', userId);

        const projects = await Project.find({ userId }).lean();
        console.log(`Found ${projects.length} projects.`);

        console.log('--- Project List ---');
        projects.forEach(p => {
            console.log(`[${p.id}] ${p.name} (Type: ${p.type}, Order: ${p.order}) - _id: ${p._id}`);
        });

        // Check for '0' vs 'inbox'
        const hasZero = projects.some(p => p.id === '0');
        const hasInbox = projects.some(p => p.id === 'inbox');

        console.log('\n--- Analysis ---');
        console.log(`Has ID '0': ${hasZero}`);
        console.log(`Has ID 'inbox': ${hasInbox}`);

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
        await mongoose.disconnect();
    }
}

dumpDB();
