# 🧠 Second Brain

> **Local-first productivity system with cloud sync**
> A self-hosted Focus To-Do–style app built with a custom backend and MongoDB.

<p align="center">
  <a href="https://itslokeshx.github.io/Second-Brain/">Live Demo</a> ·
  <a href="#features">Features</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#architecture">Architecture</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success" />
  <img src="https://img.shields.io/badge/license-MIT-blue" />
  <img src="https://img.shields.io/badge/backend-Node.js-brightgreen" />
  <img src="https://img.shields.io/badge/database-MongoDB-green" />
</p>

---

## ✨ What is Second Brain?

**Second Brain** is a modern productivity web app that helps users:

* manage tasks & projects
* focus using Pomodoro sessions
* work offline-first
* sync data securely to the cloud

It is designed as a **self-hosted, privacy-friendly alternative** to Focus To-Do, giving full control over data and infrastructure.

---

## 🚀 Features

### 📝 Tasks & Projects

* Create, edit, complete, and archive tasks
* Project & folder organization
* Priorities, tags, subtasks, notes
* Recurring tasks & deadlines

### 🍅 Pomodoro Focus

* Custom Pomodoro & break durations
* Task-level focus tracking
* Estimated vs actual focus time

### ☁️ Sync & Storage

* Local-first with **IndexedDB**
* Manual cloud sync with **MongoDB**
* Secure session-based authentication
* Fully usable offline

### 🎨 Experience

* Dark / Light mode
* Clean, distraction-free UI
* Focus reports & stats

---

## 🏗️ Architecture

```
Frontend (React Bundle)
 ├─ IndexedDB (Primary Storage)
 ├─ localStorage (Session / Fallback)
 └─ Sync Interceptors

Backend (Node + Express)
 ├─ Authentication
 ├─ Sync API
 └─ MongoDB Atlas
```

**Design principles**

* Offline-first
* Cloud as backup, not dependency
* Explicit sync (no silent data loss)

---

## 🛠️ Tech Stack

**Frontend**

* React (production bundle)
* IndexedDB
* Vanilla JavaScript
* HTML5, CSS

**Backend**

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* express-session

**Deployment**

* GitHub Pages (Frontend)
* Render (Backend)
* MongoDB Atlas (DB)

---

## ⚙️ Local Setup

### Requirements

* Node.js v18+
* MongoDB Atlas
* Git

### Backend

```bash
git clone https://github.com/itslokeshx/Second-Brain.git
cd Second-Brain/backend
npm install
npm run dev
```

`.env`

```env
MONGODB_URI=your_mongodb_uri
SESSION_SECRET=your_secret
PORT=3000
```

### Frontend

```bash
python3 -m http.server 5173
```

Open:
👉 `http://localhost:5173`

---

## 📁 Project Structure

```
Second-Brain/
├── backend/        # Node + Express backend
├── js/             # Frontend logic & interceptors
├── css/            # Styles
├── assets/         # Images & audio
├── index.html
└── README.md
```

---

## 📄 License

MIT License

> Educational & personal project
> Inspired by Focus To-Do
> No affiliation with the original product

---

## 📬 Contact

* GitHub: [itslokeshx](https://github.com/itslokeshx)
* Issues: Bug reports & feature requests

---

<div align="center">

**Built with focus by Lokesh**
⭐ Star the repo if it helped you

</div>
