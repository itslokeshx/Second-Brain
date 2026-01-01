<div align="center">

# 🧠 Second Brain

### Your Personal Productivity Hub

*A powerful, local-first task management and productivity system with bulletproof data persistence*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-yellow.svg)](https://www.javascript.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-green.svg)](https://www.mongodb.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-brightgreen.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Demo](#-demo)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)
- [Support](#-support)

---

## 🎯 About

**Second Brain** is a production-ready productivity application that serves as your digital extension of mind. Built with a **local-first architecture**, it ensures your data is always available, even offline, while providing seamless cloud synchronization across devices.

### Why Second Brain?

- 🔒 **Privacy First** - Your data stays local, syncs only when you want
- ⚡ **Lightning Fast** - Instant task completion, no lag, no delays
- 🛡️ **Bulletproof Persistence** - 3-layer data protection prevents data loss
- 🎨 **Clean Interface** - Distraction-free, professional design
- 🔄 **Smart Sync** - Conflict-free synchronization with MongoDB
- 📱 **Works Offline** - Full functionality without internet

---

## ✨ Features

### Core Functionality

#### 📝 Task Management
- ✅ Create, complete, and organize tasks effortlessly
- 🎯 Priority levels (High, Medium, Low)
- 📅 Smart deadlines (Today, Tomorrow, Week, Someday)
- 🔄 Real-time completion tracking
- 📊 Task history and analytics

#### 📁 Project Organization
- 🗂️ Custom projects and folders
- 🏷️ System projects (Today, All Tasks, History)
- 🎨 Drag-and-drop organization
- 🔍 Project-based filtering
- 📌 Pin important projects

#### 🎯 Smart Views
- 🌅 **Today's Focus** - See what matters now
- 📆 **Upcoming** - Plan ahead with deadline tracking
- ⏰ **Overdue** - Never miss important tasks
- 📜 **History** - Review completed work
- 🔍 **All Tasks** - Complete overview

#### ⏱️ Pomodoro Timer
- ⏲️ Customizable focus sessions
- ☕ Break management
- 📊 Focus time tracking
- 🎵 Optional white noise

#### ☁️ Cloud Sync
- 🔄 Automatic background sync
- 🔐 Secure MongoDB integration
- 🌐 Multi-device support
- ⚡ Conflict-free merging
- 📡 Works offline, syncs when online

### Advanced Features

#### 🛡️ Data Protection (Unique!)
- **3-Layer Defense System**:
  1. **Cursor-Based Atomic Merge** - Race-condition free
  2. **Write-Level Protection** - Intercepts dangerous overwrites
  3. **Debounce Protection** - Prevents rapid-fire conflicts

#### 🎨 UI/UX
- 🌙 Dark mode optimized
- 🎯 Minimalist, distraction-free design
- ⚡ Real-time UI updates
- 🖼️ Automatic image fallbacks
- 📱 Responsive layout

---

## 🎬 Demo

### Main Dashboard
*Clean, focused interface showing today's tasks*

### Task Management
*Create, complete, and organize tasks with ease*

### Project Organization
*Organize tasks into projects and folders*

### Pomodoro Timer
*Stay focused with built-in timer*

> **Note**: Screenshots coming soon! The app is fully functional and ready to use.

---

## 🛠️ Tech Stack

### Frontend
- **Core**: Vanilla JavaScript, HTML5, CSS3
- **Framework**: React (compiled in main.js)
- **Storage**: IndexedDB (local-first)
- **State**: localStorage + IndexedDB dual storage

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Auth**: bcrypt.js for password hashing
- **Session**: express-session with connect-mongo

### DevOps
- **Version Control**: Git
- **Package Manager**: npm
- **Development**: nodemon for hot reload

---

## 📦 Installation

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn**

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Second-Brain.git
   cd Second-Brain
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file in backend directory
   cp .env.example .env
   
   # Edit .env with your MongoDB URI
   MONGODB_URI=mongodb://localhost:27017/second-brain
   # or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/second-brain
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   # Server runs on http://localhost:3000
   ```

5. **Open the frontend**
   ```bash
   # In a new terminal, from project root
   # Serve the frontend (use any static server)
   npx serve .
   # or
   python -m http.server 8000
   ```

6. **Access the app**
   ```
   Open http://localhost:8000 in your browser
   ```

### Production Deployment

#### Frontend (Static Hosting)
Deploy to Netlify, Vercel, or GitHub Pages:
```bash
# Build is already optimized
# Just deploy the root directory (excluding backend/)
```

#### Backend (Node.js Hosting)
Deploy to Heroku, Railway, or Render:
```bash
cd backend
# Set environment variables on your hosting platform
# Deploy the backend directory
```

---

## 🚀 Usage

### First Time Setup

1. **Create an account** - Click "Register" on the login page
2. **Login** - Use your credentials
3. **Start adding tasks** - Click "+" to create your first task
4. **Organize with projects** - Create custom projects for different areas
5. **Sync your data** - Click the sync button to backup to cloud

### Daily Workflow

1. **Morning**: Check "Today" view for your daily tasks
2. **Focus**: Use Pomodoro timer for deep work
3. **Organize**: Move tasks between projects as needed
4. **Complete**: Check off tasks as you finish them
5. **Evening**: Review completed tasks in History

### Keyboard Shortcuts

- `Ctrl/Cmd + N` - New task
- `Ctrl/Cmd + S` - Sync data
- `Ctrl/Cmd + F` - Search tasks
- `Escape` - Close dialogs

---

## 🏗️ Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         User Actions                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    React UI (main.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Tasks      │  │   Projects   │  │   Pomodoro   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Data Protection Layer (NEW!)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Write Protector - Blocks dirty overwrites       │   │
│  │  2. Cursor Merge - Atomic sync flag checking        │   │
│  │  3. Debounce - Prevents rapid-fire conflicts        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│   IndexedDB      │    │   localStorage   │
│  (Primary Store) │    │  (Backup Store)  │
└────────┬─────────┘    └─────────┬────────┘
         │                        │
         └────────┬───────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Session Manager (Sync Orchestrator)             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Express)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth Routes │  │  Sync Routes │  │ Legacy Routes│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Users     │  │    Tasks     │  │   Projects   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### Frontend
- **`main.js`** - React application bundle (4.8MB)
- **`session-manager.js`** - Sync orchestration & data management
- **`indexeddb-write-protector.js`** - Prevents data corruption
- **`indexeddb-guardian.js`** - System project protection
- **`ui-cleanup.js`** - UI customization
- **`system-projects.js`** - Mandatory system projects

#### Backend
- **`server.js`** - Express server setup
- **`routes/auth.js`** - Authentication endpoints
- **`routes/sync.js`** - Data synchronization
- **`models/`** - MongoDB schemas

---

## 📚 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Sync

#### Full Sync
```http
POST /api/sync/all
Authorization: Bearer <token>
Content-Type: application/json

{
  "tasks": [...],
  "projects": [...],
  "pomodoros": [...]
}
```

#### Load Data
```http
GET /api/sync/load
Authorization: Bearer <token>
```

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Task management with priorities
- [x] Project organization
- [x] Pomodoro timer
- [x] Cloud sync with MongoDB
- [x] 3-layer data protection
- [x] Offline-first architecture
- [x] Clean UI without premium clutter

### 🚧 In Progress
- [ ] Mobile app (React Native)
- [ ] Browser extensions
- [ ] Collaboration features

### 📋 Planned
- [ ] Calendar integration
- [ ] Recurring tasks
- [ ] Subtask support
- [ ] Tags and labels
- [ ] Advanced search
- [ ] Data export (JSON, CSV)
- [ ] Themes and customization
- [ ] Habit tracking
- [ ] Goal setting
- [ ] Time analytics dashboard

---

## 🤝 Contributing

Contributions are what make the open-source community amazing! Any contributions you make are **greatly appreciated**.

### How to Contribute

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Write clear commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

### Bug Reports

Found a bug? Please open an issue with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- Inspired by productivity methodologies like GTD and Pomodoro
- Built with modern web technologies
- Community feedback and contributions

---

## 💬 Support

### Get Help

- 📧 **Email**: support@secondbrain.app
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/Second-Brain/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/Second-Brain/issues)

### Stay Updated

- ⭐ **Star this repo** to show support
- 👀 **Watch** for updates
- 🔔 **Follow** for announcements

---

<div align="center">

**Made with ❤️ by the Second Brain Team**

[⬆ Back to Top](#-second-brain)

</div>
