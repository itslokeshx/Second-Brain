# 🧠 Second Brain

> **A self-hosted, local-first productivity application** - A complete clone and enhancement of Focus To-Do with MongoDB cloud sync, built from reverse-engineering a production React application.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://itslokeshx.github.io/Second-Brain/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![MongoDB](https://img.shields.io/badge/database-MongoDB-green.svg)](https://www.mongodb.com/)
[![Node.js](https://img.shields.io/badge/backend-Node.js-brightgreen.svg)](https://nodejs.org/)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [How It Works](#-how-it-works)
- [Installation](#-installation)
- [Development Journey](#-development-journey)
- [Struggles & Solutions](#-struggles--solutions)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Second Brain** is a fully functional productivity application that combines task management, Pomodoro timer, and project organization. Originally reverse-engineered from the Focus To-Do web application, it has been transformed into a **self-hosted, privacy-first alternative** with MongoDB cloud synchronization.

### What Makes This Special?

- 🔓 **Fully Self-Hosted**: Complete control over your data
- 🌐 **Local-First Architecture**: Works offline, syncs when online
- 🔄 **Hybrid Sync System**: Combines localStorage with MongoDB cloud backup
- 🛠️ **Reverse-Engineered**: Built by analyzing and patching a production React app
- 🎨 **Complete UI**: All original features preserved and enhanced
- 📱 **Cross-Platform**: Works on any device with a web browser

---

## ✨ Features

### Core Functionality

#### 📋 Task Management
- ✅ Create, edit, delete, and complete tasks
- 📁 Organize tasks into projects and folders
- 🏷️ Tag tasks for better organization
- 🔄 Recurring tasks with flexible schedules
- ⏰ Task reminders and due dates
- 📊 Priority levels (Low, Medium, High)
- 📝 Subtasks and notes support
- 🔍 Advanced search and filtering

#### 🍅 Pomodoro Timer
- ⏱️ Customizable Pomodoro intervals (default: 25 minutes)
- ☕ Short and long break timers
- 🎵 White noise and alarm sounds
- 📈 Automatic time tracking per task
- 📊 Pomodoro statistics and history
- 🎯 Estimated vs actual Pomodoro comparison

#### 📊 Project Management
- 📂 Unlimited projects (Premium feature in original)
- 🎨 Color-coded projects
- 📁 Folder organization
- 📈 Project-level statistics
- 🔄 Project archiving and completion

#### 📈 Reports & Analytics
- 📊 Daily, weekly, monthly, and yearly reports
- ⏱️ Focus time distribution by project
- 📈 Task completion charts
- 🎯 Focus time goals and tracking
- 📉 Productivity trends

#### 🔄 Synchronization
- ☁️ MongoDB cloud backup
- 💾 Local-first with IndexedDB
- 🔄 Manual sync button
- 🔐 Secure session-based authentication
- 📡 Real-time sync status display

#### 🎨 Customization
- 🌓 Dark/Light mode
- 🎨 Multiple themes
- 🔊 Customizable alarm sounds
- 🎵 White noise options
- ⚙️ Extensive settings

---

## 🏗️ Architecture

### System Design

Second Brain uses a **hybrid local-first architecture** with cloud synchronization:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  React UI  │  │  IndexedDB   │  │  localStorage    │    │
│  │  (main.js) │  │  (Primary)   │  │  (Fallback)      │    │
│  └────────────┘  └──────────────┘  └──────────────────┘    │
│         │                │                    │              │
│         └────────────────┴────────────────────┘              │
│                          │                                   │
│                          ▼                                   │
│         ┌─────────────────────────────────┐                 │
│         │   Interceptor & Patcher Layer   │                 │
│         │  - Network Interceptor          │                 │
│         │  - IndexedDB Guardian           │                 │
│         │  - Data Sanitizer               │                 │
│         │  - Session Manager              │                 │
│         └─────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       Backend Layer                          │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ Express.js │  │  Mongoose    │  │  MongoDB Atlas   │    │
│  │  Server    │  │  ODM         │  │  (Cloud DB)      │    │
│  └────────────┘  └──────────────┘  └──────────────────┘    │
│         │                │                    │              │
│         └────────────────┴────────────────────┘              │
│                          │                                   │
│         ┌─────────────────────────────────┐                 │
│         │         API Routes              │                 │
│         │  - /v63/user/login              │                 │
│         │  - /v63/user/register           │                 │
│         │  - /v64/sync                    │                 │
│         │  - /api/sync/all                │                 │
│         └─────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction** → React UI (main.js)
2. **Local Storage** → IndexedDB (primary) + localStorage (fallback)
3. **Interceptor Layer** → Patches and normalizes data
4. **Sync Trigger** → Manual sync button or auto-sync
5. **Backend API** → Express.js server
6. **Cloud Storage** → MongoDB Atlas
7. **Data Load** → Server → Interceptors → IndexedDB → UI

### Key Components

#### Frontend Interceptors (53 JavaScript files)

| Component | Purpose |
|-----------|---------|
| `data-sanitizer.js` | Ensures default projects exist, prevents blank UI |
| `indexeddb-guardian.js` | Intercepts IndexedDB operations, provides synced data |
| `session-manager.js` | Manages user sessions, displays sync status |
| `sync-button-handler.js` | Handles manual sync operations |
| `hydration-mutex.js` | Prevents race conditions during data loading |
| `network-interceptor.js` | Redirects API calls to local backend |
| `cookie-patcher.js` | Ensures proper cookie format for legacy code |
| `system-projects.js` | Defines 18 mandatory system projects |

#### Backend Services

| Service | Purpose |
|---------|---------|
| `server.js` | Main Express server with session management |
| `models/` | Mongoose schemas (User, Project, Task, Pomodoro) |
| `routes/` | API endpoints for auth and sync |
| `services/keepAlive.js` | Keeps Render.com deployment alive |

---

## 🛠️ Tech Stack

### Frontend
- **React** (via main.js - 2.5MB minified bundle)
- **IndexedDB** - Primary local storage
- **localStorage** - Fallback storage
- **Vanilla JavaScript** - 53 custom interceptor/patcher scripts
- **CSS** - 333KB of styling (main.css)
- **HTML5** - Single-page application

### Backend
- **Node.js** (v18+)
- **Express.js** - Web framework
- **MongoDB** - Cloud database (MongoDB Atlas)
- **Mongoose** - ODM for MongoDB
- **express-session** - Session management
- **connect-mongo** - MongoDB session store
- **bcryptjs** - Password hashing
- **cors** - Cross-origin resource sharing
- **cookie-parser** - Cookie handling

### DevOps & Deployment
- **GitHub Pages** - Frontend hosting
- **Render.com** - Backend hosting (free tier)
- **MongoDB Atlas** - Database hosting (free tier)
- **Vercel** - Alternative deployment option

### Development Tools
- **nodemon** - Development server
- **dotenv** - Environment variables
- **Git** - Version control

---

## 🔧 How It Works

### 1. Application Boot Sequence

```javascript
// index.html loads in this order:
1. Loading Orchestrator → Shows neural loader animation
2. URL Interceptor → Redirects focustodo.net to local backend
3. i18n System → Loads translations (hardcoded in window.I18N_DATA)
4. Data Sanitizer → Creates default projects if missing
5. System Projects → Defines 18 mandatory projects
6. IndexedDB Guardian → Intercepts database operations
7. Hydration Gate → Waits for data to be ready
8. main.js → React application loads
9. Session Manager → Displays user info and sync button
```

### 2. Authentication Flow

```javascript
// Login Process
User enters email/password
  ↓
Frontend: login-interceptor.js intercepts form
  ↓
POST /v63/user/login
  ↓
Backend: Verifies credentials with bcrypt
  ↓
Creates session in MongoDB session store
  ↓
Sets cookies: ACCT, NAME, UID, PID, secondbrain.sid
  ↓
Returns: { status: 0, uid, acct, name, jsessionId, token }
  ↓
Frontend: Stores in localStorage + cookies
  ↓
Session Manager displays username and "Sync Now" button
```

### 3. Data Synchronization

#### Local → Cloud (Upload)

```javascript
// Triggered by "Sync Now" button
1. sync-button-handler.js collects data from IndexedDB
2. Normalizes projects, tasks, pomodoros
3. POST /api/sync/all with JSON payload
4. Backend validates session
5. Mongoose upserts data to MongoDB
6. Returns sync statistics
```

#### Cloud → Local (Download)

```javascript
// Triggered on login or manual sync
1. POST /v64/sync (empty body = load request)
2. Backend queries MongoDB for user's data
3. Normalizes data (fixes orphaned tasks, calculates durations)
4. Returns JSON with projects, tasks, pomodoros
5. indexeddb-guardian.js intercepts response
6. Writes data to IndexedDB
7. React UI re-renders with new data
```

### 4. Data Integrity System

The application uses multiple layers to prevent data corruption:

```javascript
// Layer 1: Server-side normalization (server.js)
- Ensures default project exists
- Fixes orphaned tasks (assigns to Inbox if parent missing)
- Calculates actualPomoNum from pomodoro logs
- Validates all numeric fields

// Layer 2: Client-side sanitization (data-sanitizer.js)
- Creates 18 system projects if missing
- Ensures "Tasks" (id: 0) and "Inbox" exist
- Prevents blank UI on first load

// Layer 3: IndexedDB Guardian (indexeddb-guardian.js)
- Intercepts all IndexedDB writes
- Prevents overwriting valid data with empty data
- Maintains data consistency during sync

// Layer 4: Hydration Mutex (hydration-mutex.js)
- Prevents race conditions
- Ensures data is loaded before React renders
- Coordinates multiple async data sources
```

---

## 📦 Installation

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB Atlas** account (free tier)
- **Git**

### Quick Start

#### 1. Clone the Repository

```bash
git clone https://github.com/itslokeshx/Second-Brain.git
cd Second-Brain
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/second-brain
SESSION_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Start backend:

```bash
npm run dev
# Server runs on http://localhost:3000
```

#### 3. Frontend Setup

Update `js/config.js`:

```javascript
window.SECOND_BRAIN_CONFIG = {
    API_BASE_URL: 'http://localhost:3000',
    USE_LOCAL_BACKEND: true
};
```

Serve frontend (choose one):

```bash
# Option 1: Python
python3 -m http.server 5173

# Option 2: Node.js http-server
npx http-server -p 5173 -c-1

# Option 3: VS Code Live Server
# Install "Live Server" extension and click "Go Live"
```

#### 4. Access Application

Open browser: `http://localhost:5173`

---

## 🚀 Development Journey

This project was built over **multiple weeks** through an iterative process of reverse-engineering, debugging, and enhancement. Here's the story:

### Phase 1: Discovery & Reverse Engineering
**Goal**: Understand how Focus To-Do works

- 🔍 Analyzed network traffic using Chrome DevTools
- 📦 Extracted `main.js` (2.5MB React bundle)
- 🗺️ Mapped API endpoints (`/v63/user/login`, `/v64/sync`, etc.)
- 📊 Reverse-engineered data schemas from API responses
- 🎨 Extracted CSS and assets

**Key Discovery**: The entire app is a single React bundle that relies on:
- `focustodo.net` API for authentication and sync
- IndexedDB for local storage
- Specific cookie format for session management

### Phase 2: Backend Migration
**Goal**: Replace `focustodo.net` with self-hosted backend

**Challenges**:
1. ❌ **CORS Errors**: `origin 'null'` blocked by CORS policy
   - **Solution**: Configured Express CORS to allow `null` origin for file:// protocol

2. ❌ **Session Persistence**: Sessions not persisting across requests
   - **Solution**: Implemented `connect-mongo` for MongoDB session store

3. ❌ **Password Hashing**: Bcrypt comparison failing
   - **Solution**: Created `matchPassword` method in User model

4. ❌ **Cookie Format**: Legacy code expected specific cookie names
   - **Solution**: Created `cookie-patcher.js` to inject ACCT, NAME, UID cookies

**Result**: ✅ Fully functional Node.js/Express backend with MongoDB

### Phase 3: Frontend Integration
**Goal**: Make legacy React app work with new backend

**Challenges**:
1. ❌ **Blank UI After Login**: React rendered but showed no data
   - **Root Cause**: IndexedDB was empty on first load
   - **Solution**: Created `data-sanitizer.js` to seed default projects

2. ❌ **i18n Strings Not Loading**: UI showed `[prj_today]` instead of "Today"
   - **Root Cause**: XHR requests for translation files failed (CORS)
   - **Solution**: Hardcoded `window.I18N_DATA` in `index.html`

3. ❌ **Asset Paths Broken**: Images showed 404 errors
   - **Root Cause**: Paths had double prefixes (`assets/assets/img`)
   - **Solution**: Created `asset-path-patcher.js` to normalize paths

4. ❌ **WebSocket Errors**: App tried to connect to `focustodo.net` WebSocket
   - **Solution**: Created `websocket-mock.js` to stub WebSocket

**Result**: ✅ UI rendering correctly with all features working

### Phase 4: Synchronization System
**Goal**: Implement bidirectional sync with MongoDB

**Challenges**:
1. ❌ **Sync Hang (Infinite Spinner)**: Sync button never completed
   - **Root Cause**: Frontend expected specific JSON structure
   - **Solution**: Matched exact response format with all required arrays

2. ❌ **Data Overwrites**: Synced data disappeared after reload
   - **Root Cause**: IndexedDB queries returned empty results
   - **Solution**: Created `indexeddb-guardian.js` to intercept and serve data

3. ❌ **Orphaned Tasks**: Tasks with invalid `projectId` crashed UI
   - **Solution**: Server-side normalization to reassign to Inbox (id: 0)

4. ❌ **Pomodoro Duration Reset**: `actualPomoNum` reset to 0 after sync
   - **Root Cause**: Server didn't calculate from pomodoro logs
   - **Solution**: Added server-side aggregation to count completed pomodoros

**Result**: ✅ Robust sync system with data integrity checks

### Phase 5: System Stability
**Goal**: Prevent crashes and data corruption

**Challenges**:
1. ❌ **Blank UI After Reload**: App showed loading screen forever
   - **Root Cause**: Race condition between data load and React render
   - **Solution**: Created `hydration-mutex.js` to coordinate async operations

2. ❌ **Task Operations Broken**: Couldn't complete/delete tasks
   - **Root Cause**: IndexedDB write operations intercepted incorrectly
   - **Solution**: Refined `indexeddb-write-protector.js` to allow mutations

3. ❌ **Logout 404 Error**: GitHub Pages showed 404 after logout redirect
   - **Root Cause**: SPA routing not configured for GitHub Pages
   - **Solution**: Created `404.html` to redirect to `index.html`

4. ❌ **Username Displayed as Garbage**: Showed `���` instead of name
   - **Root Cause**: Cookie encoding mismatch
   - **Solution**: Created `username-display-fixer.js` to decode properly

**Result**: ✅ Stable application with no critical bugs

### Phase 6: Polish & Deployment
**Goal**: Production-ready deployment

**Achievements**:
- ✅ Deployed backend to Render.com (free tier)
- ✅ Deployed frontend to GitHub Pages
- ✅ Configured MongoDB Atlas (free tier)
- ✅ Implemented keep-alive service for Render.com
- ✅ Added comprehensive error handling
- ✅ Created session management UI
- ✅ Optimized for mobile devices

---

## 😤 Struggles & Solutions

### Critical Bugs Fixed

#### 1. **The Blank UI Mystery** 🔍
**Problem**: After login, UI was completely blank. No errors in console.

**Investigation**:
- React was rendering (`#root` had content)
- IndexedDB was empty
- `main.js` expected projects to exist

**Root Cause**: The original app relied on server to send default projects. Our backend didn't.

**Solution**: Created `data-sanitizer.js` that runs BEFORE `main.js`:
```javascript
// Seed default projects if IndexedDB is empty
const defaultProjects = [
    { id: '0', name: 'Inbox', type: 1000, ... },
    { id: 'myday', name: 'Today\'s Tasks', type: 1, ... },
    // ... 16 more system projects
];
```

**Lesson Learned**: Legacy apps have hidden dependencies. Always check what data the app expects on boot.

---

#### 2. **The Sync Hang** ⏳
**Problem**: Clicking "Sync Now" showed infinite spinner. No error, no completion.

**Investigation**:
- Request reached backend ✅
- Backend returned 200 OK ✅
- Frontend never acknowledged response ❌

**Root Cause**: Frontend expected exact JSON structure:
```javascript
// Expected
{ status: 0, projects: [], tasks: [], pomodoros: [], subtasks: [], project_member: [] }

// We returned
{ success: true, projects: [], tasks: [], pomodoros: [] }
```

**Solution**: Matched exact response format in `server.js`:
```javascript
res.json({
    status: 0,  // Not "success: true"
    projects: normalizedProjects,
    tasks: normalizedTasks,
    pomodoros: normalizedPomodoros,
    subtasks: [],  // Required even if empty
    project_member: []  // Required even if empty
});
```

**Lesson Learned**: When working with legacy code, match the EXACT API contract. Don't assume modern conventions.

---

#### 3. **The Pomodoro Duration Reset** ⏱️
**Problem**: After sync, all tasks showed 0 elapsed time, even though pomodoro logs existed.

**Investigation**:
- Pomodoro logs were in MongoDB ✅
- `actualPomoNum` field was 0 in tasks ❌
- UI calculated elapsed time from `actualPomoNum` ❌

**Root Cause**: We synced pomodoro logs but never updated task counters.

**Solution**: Server-side aggregation in `server.js`:
```javascript
// Count pomodoros per task
const pomodorosByTask = {};
for (const pomo of normalizedPomodoros) {
    if (pomo.taskId && pomo.status === 'completed') {
        pomodorosByTask[pomo.taskId] = (pomodorosByTask[pomo.taskId] || 0) + 1;
    }
}

// Update task actualPomoNum
normalizedTasks.forEach(task => {
    const count = pomodorosByTask[task.id] || 0;
    if (count > 0) {
        task.actualPomoNum = count;
        task.actPomodoros = count;
    }
});
```

**Lesson Learned**: Denormalized data requires manual consistency maintenance. Always sync derived fields.

---

#### 4. **The IndexedDB Guardian** 🛡️
**Problem**: Data loaded from server disappeared immediately after being written to IndexedDB.

**Investigation**:
- Server returned data ✅
- Data written to IndexedDB ✅
- `main.js` queried IndexedDB ✅
- Query returned empty results ❌

**Root Cause**: `main.js` used IndexedDB cursors with specific indexes. Our writes didn't match the expected schema.

**Solution**: Created `indexeddb-guardian.js` to intercept ALL IndexedDB operations:
```javascript
// Intercept IDBObjectStore.prototype.openCursor
const originalOpenCursor = IDBObjectStore.prototype.openCursor;
IDBObjectStore.prototype.openCursor = function(...args) {
    const request = originalOpenCursor.apply(this, args);
    
    // Intercept onsuccess
    const originalOnSuccess = request.onsuccess;
    request.onsuccess = function(event) {
        // Inject our synced data into cursor results
        // ...
    };
    
    return request;
};
```

**Lesson Learned**: When data flow is opaque, intercept at the lowest level (browser APIs).

---

#### 5. **The Race Condition Nightmare** 🏁
**Problem**: Sometimes UI loaded correctly, sometimes blank. Non-deterministic.

**Investigation**:
- Data was in IndexedDB ✅
- `main.js` sometimes queried before data was ready ❌
- No synchronization mechanism ❌

**Root Cause**: Multiple async operations (fetch, IndexedDB writes, React render) with no coordination.

**Solution**: Created `hydration-mutex.js` with a promise-based gate:
```javascript
window.__HYDRATION_COMPLETE__ = new Promise((resolve) => {
    window.__HYDRATION_RESOLVE__ = resolve;
});

// data-sanitizer.js calls this after seeding
window.__HYDRATION_RESOLVE__({ success: true });

// index.html waits before loading main.js
await window.__HYDRATION_COMPLETE__;
const script = document.createElement('script');
script.src = 'js/main.js';
document.body.appendChild(script);
```

**Lesson Learned**: Async operations need explicit coordination. Promises are your friend.

---

#### 6. **The Cookie Encoding Disaster** 🍪
**Problem**: Username displayed as `���` (garbage characters).

**Investigation**:
- Backend set cookie: `NAME=John%20Doe` ✅
- Frontend read cookie: `NAME=John%20Doe` ✅
- Display showed: `���` ❌

**Root Cause**: `main.js` expected cookies in `document.cookie`, but our interceptor only set `localStorage`.

**Solution**: Created `cookie-injector.js`:
```javascript
// After login, inject into BOTH localStorage AND document.cookie
document.cookie = `NAME=${encodeURIComponent(userName)}; path=/`;
localStorage.setItem('NAME', userName);
```

**Lesson Learned**: Legacy code may read from multiple sources. Set data everywhere it expects.

---

#### 7. **The GitHub Pages 404** 🚫
**Problem**: After logout, redirect to `/?timestamp=123` showed GitHub Pages 404.

**Investigation**:
- Logout redirected to `/?timestamp=123` ✅
- GitHub Pages didn't recognize query params as `index.html` ❌
- SPA routing broken ❌

**Root Cause**: GitHub Pages serves static files. It doesn't know `/?timestamp=123` should serve `index.html`.

**Solution**: Created `404.html` that redirects to `index.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <script>
        // Preserve query params and redirect to index.html
        const params = window.location.search;
        window.location.replace('/Second-Brain/' + params);
    </script>
</head>
</html>
```

**Lesson Learned**: SPAs on static hosts need special routing configuration.

---

### Technical Debt & Workarounds

#### 1. **53 JavaScript Files** 📚
The frontend has 53 separate JavaScript files because:
- Each file patches a specific bug or adds a feature
- Modifying `main.js` (2.5MB minified) is impractical
- Interceptor pattern allows surgical fixes

**Trade-off**: Maintainability vs. Simplicity
- ✅ Easy to add new fixes
- ❌ Hard to understand full data flow

#### 2. **Hardcoded i18n** 🌐
Translations are hardcoded in `index.html` (445 lines) because:
- XHR requests for JSON files fail with CORS
- `main.js` expects `window.I18N_DATA` to exist

**Trade-off**: Flexibility vs. Reliability
- ✅ Always works, no network dependency
- ❌ Can't dynamically load languages

#### 3. **Dual Storage** 💾
Data is stored in BOTH IndexedDB and localStorage because:
- `main.js` uses IndexedDB for primary data
- Session management uses localStorage
- Some legacy code checks localStorage first

**Trade-off**: Redundancy vs. Compatibility
- ✅ Works with all legacy code paths
- ❌ Data can get out of sync

---

## 📚 API Documentation

### Authentication Endpoints

#### POST `/v63/user/register`
Register a new user account.

**Request**:
```json
{
    "account": "user@example.com",
    "password": "securepassword"
}
```

**Response**:
```json
{
    "status": 0,
    "success": true,
    "uid": "user_id",
    "acct": "user@example.com",
    "name": "user",
    "jsessionId": "session_id",
    "token": "session_token"
}
```

#### POST `/v63/user/login`
Authenticate existing user.

**Request**:
```json
{
    "account": "user@example.com",
    "password": "securepassword"
}
```

**Response**: Same as register

#### POST `/v63/user/logout`
Destroy user session and clear cookies.

**Response**:
```json
{
    "status": 0,
    "success": true,
    "message": "Logged out successfully"
}
```

---

### Synchronization Endpoints

#### POST `/v64/sync`
Load user data from MongoDB (empty body) or sync data (with body).

**Request (Load)**:
```json
{}
```

**Response**:
```json
{
    "status": 0,
    "success": true,
    "projects": [...],
    "tasks": [...],
    "pomodoros": [...],
    "subtasks": [],
    "project_member": []
}
```

#### POST `/api/sync/all`
Upload local data to MongoDB.

**Request**:
```json
{
    "projects": [...],
    "tasks": [...],
    "pomodoroLogs": [...]
}
```

**Response**:
```json
{
    "success": true,
    "message": "Data synced to MongoDB",
    "projectsSynced": 5,
    "tasksSynced": 20,
    "logsSynced": 15
}
```

---

### Data Schemas

#### Project Schema
```javascript
{
    id: String,           // Unique ID
    name: String,         // Project name
    type: Number,         // 1000 = regular, 1-10 = system
    color: String,        // Hex color code
    state: Number,        // 0 = visible, 1 = hidden
    order: Number,        // Sort order
    parentId: String,     // Folder ID (empty for root)
    closed: Boolean,      // Archived
    deleted: Boolean      // Soft delete
}
```

#### Task Schema
```javascript
{
    id: String,              // Unique ID
    title: String,           // Task title
    projectId: String,       // Parent project ID
    priority: Number,        // 0-3 (none, low, med, high)
    completed: Boolean,      // Completion status
    deleted: Boolean,        // Soft delete
    estimatePomoNum: Number, // Estimated pomodoros
    actualPomoNum: Number,   // Completed pomodoros
    pomodoroInterval: Number,// Pomodoro length (seconds)
    deadline: Number,        // Unix timestamp
    reminder: Number,        // Unix timestamp
    repeat: Object,          // Recurrence rules
    tags: Array,             // Tag IDs
    subtasks: Array,         // Subtask objects
    remark: String           // Notes
}
```

#### Pomodoro Schema
```javascript
{
    id: String,        // Unique ID
    taskId: String,    // Associated task ID
    status: String,    // 'completed', 'stopped'
    duration: Number,  // Duration in milliseconds
    startTime: Number, // Unix timestamp
    endTime: Number,   // Unix timestamp
    isManual: Boolean  // Manually added
}
```

---

## 📁 Project Structure

```
Second-Brain/
├── backend/
│   ├── models/
│   │   ├── User.js              # User schema with bcrypt
│   │   ├── Project.js           # Project schema
│   │   ├── Task.js              # Task schema
│   │   └── Pomodoro.js          # Pomodoro log schema
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   └── sync.js              # Sync routes
│   ├── services/
│   │   └── keepAlive.js         # Render.com keep-alive
│   ├── server.js                # Main Express server
│   ├── package.json
│   └── .env.example
│
├── js/                          # 53 frontend scripts
│   ├── main.js                  # React app (2.5MB)
│   ├── config.js                # API configuration
│   ├── data-sanitizer.js        # Default project seeder
│   ├── indexeddb-guardian.js    # IndexedDB interceptor
│   ├── session-manager.js       # Session UI
│   ├── sync-button-handler.js   # Sync logic
│   ├── hydration-mutex.js       # Race condition prevention
│   ├── system-projects.js       # 18 system projects
│   ├── cookie-patcher.js        # Cookie format fixer
│   ├── network-interceptor.js   # API redirect
│   └── ... (44 more files)
│
├── css/
│   ├── main.css                 # 333KB of styles
│   └── neural-loader.css        # Loading animation
│
├── assets/
│   ├── img/                     # Images
│   ├── audio/                   # Sounds
│   └── fonts/                   # Fonts
│
├── index.html                   # Main HTML file
├── 404.html                     # GitHub Pages SPA routing
├── README.md                    # This file
├── render.yaml                  # Render.com config
└── vercel.json                  # Vercel config
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Areas for Improvement

1. **Code Refactoring**
   - Consolidate 53 JS files into modules
   - Extract `main.js` into readable React components
   - Implement proper TypeScript types

2. **Features**
   - Auto-sync (currently manual only)
   - Real-time collaboration
   - Mobile app (React Native)
   - Browser extension

3. **Performance**
   - Lazy load `main.js` chunks
   - Optimize IndexedDB queries
   - Implement service worker for offline

4. **Testing**
   - Unit tests for interceptors
   - Integration tests for sync
   - E2E tests with Playwright

### Development Setup

```bash
# Fork the repo
git clone https://github.com/YOUR_USERNAME/Second-Brain.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test locally
npm run dev

# Commit with conventional commits
git commit -m "feat: add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

---

## 📄 License

This project is licensed under the **MIT License**.

**Important Notes**:
- This is a reverse-engineered clone of Focus To-Do
- Original app: [focustodo.cn](https://www.focustodo.cn/)
- This project is for educational purposes
- No affiliation with the original developers

---

## 🙏 Acknowledgments

- **Focus To-Do** - Original application that inspired this project
- **MongoDB** - For generous free tier
- **Render.com** - For free backend hosting
- **GitHub Pages** - For free frontend hosting
- **Open Source Community** - For amazing tools and libraries

---

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/itslokeshx/Second-Brain/issues)
- **Discussions**: [Ask questions or share ideas](https://github.com/itslokeshx/Second-Brain/discussions)
- **Email**: [Your email if you want to share]

---

## 🎯 Roadmap

### Short-term (Next 3 months)
- [ ] Auto-sync every 5 minutes
- [ ] Conflict resolution for concurrent edits
- [ ] Export data to JSON/CSV
- [ ] Import from other apps (Todoist, Trello)

### Medium-term (6 months)
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Desktop app (Electron)

### Long-term (1 year)
- [ ] AI-powered task suggestions
- [ ] Calendar integration
- [ ] Team workspaces
- [ ] Premium features (self-hosted)

---

## 📊 Stats

- **Lines of Code**: ~50,000+
- **Development Time**: 4+ weeks
- **Bugs Fixed**: 20+ critical issues
- **Coffee Consumed**: ☕☕☕☕☕ (too many to count)

---

<div align="center">

**Built with ❤️ by [itslokeshx](https://github.com/itslokeshx)**

If this project helped you, consider giving it a ⭐!

</div>
