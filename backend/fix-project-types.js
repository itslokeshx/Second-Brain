#!/usr/bin/env node
/**
 * Fix project types in MongoDB
 * Ensures project '0' has type 1000 (regular project)
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/second-brain';

async function fixProjectTypes() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Project = require('./models/Project');

        // Fix project 0 type
        const result = await Project.updateMany(
            { id: '0', type: { $in: [0, '0', null, undefined] } },
            { $set: { type: 1000 } }
        );

        console.log(`✅ Fixed ${result.modifiedCount} projects with ID '0'`);

        // Also fix any other projects with type 0
        const result2 = await Project.updateMany(
            { type: 0 },
            { $set: { type: 1000 } }
        );

        console.log(`✅ Fixed ${result2.modifiedCount} other projects with type 0`);

        // Show all projects
        const projects = await Project.find({}).select('id name type').lean();
        console.log('\nAll projects:');
        projects.forEach(p => console.log(`  ${p.id}: ${p.name} (type: ${p.type})`));

        await mongoose.disconnect();
        console.log('\n✅ Done');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixProjectTypes();
