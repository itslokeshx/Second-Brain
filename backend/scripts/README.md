# Backend Utility Scripts

This directory contains utility scripts for database management and maintenance.

## Available Scripts

### `clear-db.js`
**Purpose:** Clears all data from the MongoDB database while preserving the database structure.

**Usage:**
```bash
cd backend
node scripts/clear-db.js
```

**Warning:** ⚠️ This will delete all user data, projects, tasks, and pomodoro logs. Use with caution!

**When to use:**
- During development to reset the database to a clean state
- Before running integration tests
- When you need to start fresh with an empty database

---

### `complete-db-reset.js`
**Purpose:** Performs a complete database reset, including dropping collections and recreating indexes.

**Usage:**
```bash
cd backend
node scripts/complete-db-reset.js
```

**Warning:** ⚠️ This is a destructive operation that will completely wipe the database. Only use in development!

**When to use:**
- When database schema has changed significantly
- To fix database corruption issues
- During major version upgrades
- When you need to completely rebuild the database structure

---

## Safety Notes

1. **Never run these scripts in production** without a backup
2. These scripts are intended for **development use only**
3. Always ensure you have a backup before running any database reset script
4. The scripts will prompt for confirmation before executing (if implemented)

## Environment Variables

Make sure your `.env` file is properly configured with:
- `MONGODB_URI` - Your MongoDB connection string
- Other required environment variables

## Troubleshooting

If you encounter connection errors:
1. Verify MongoDB is running
2. Check your `.env` file configuration
3. Ensure you have proper database permissions
