#!/usr/bin/env node
/**
 * Fix ALL project fields in MongoDB
 * ═══════════════════════════════════════════════════════════════════════════
 * Ensures all projects have the required fields for main.js IndexedDB queries:
 * - state: 0 or 1 (required for state index)
 * - order: number (required for sorting)
 * - sync: 1 (synced)
 * - type: number (NOT string "0")
 * ═══════════════════════════════════════════════════════════════════════════
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/second-brain';

async function fixAllProjects() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Project = require('./models/Project');

        // Fix projects missing state field or with undefined state
        const result1 = await Project.updateMany(
            { $or: [{ state: { $exists: false } }, { state: null }] },
            { $set: { state: 0 } }
        );
        console.log(`✅ Fixed ${result1.modifiedCount} projects with missing state`);

        // Fix projects missing order field
        const result2 = await Project.updateMany(
            { $or: [{ order: { $exists: false } }, { order: null }] },
            { $set: { order: 0 } }
        );
        console.log(`✅ Fixed ${result2.modifiedCount} projects with missing order`);

        // Fix projects missing sync field
        const result3 = await Project.updateMany(
            { $or: [{ sync: { $exists: false } }, { sync: null }] },
            { $set: { sync: 1 } }
        );
        console.log(`✅ Fixed ${result3.modifiedCount} projects with missing sync`);

        // Fix projects with string type "0" (should be number 1000)
        const result4 = await Project.updateMany(
            { type: '0' },
            { $set: { type: 1000 } }
        );
        console.log(`✅ Fixed ${result4.modifiedCount} projects with type "0" string`);

        // Fix projects with number type 0 (should be 1000 for regular projects)
        const result5 = await Project.updateMany(
            { type: 0 },
            { $set: { type: 1000 } }
        );
        console.log(`✅ Fixed ${result5.modifiedCount} projects with type 0`);

        // Fix projects missing orderingRule
        const result6 = await Project.updateMany(
            { $or: [{ orderingRule: { $exists: false } }, { orderingRule: null }] },
            { $set: { orderingRule: 0 } }
        );
        console.log(`✅ Fixed ${result6.modifiedCount} projects with missing orderingRule`);

        // Show sample of fixed projects
        const samples = await Project.find({}).select('id name type state order sync').limit(10).lean();
        console.log('\nSample projects after fix:');
        samples.forEach(p => {
            console.log(`  ${p.id}: type=${p.type}, state=${p.state}, order=${p.order}, sync=${p.sync}`);
        });

        await mongoose.disconnect();
        console.log('\n✅ All projects fixed!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixAllProjects();
