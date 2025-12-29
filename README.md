# 🧠 Second Brain

> **Self-hosted backend & cloud sync for Focus To-Do (offline-first productivity app)**
> Custom Node.js + MongoDB backend that enables cross-device sync for a local-only frontend.

🌐 **Live App:** [https://second-brain-hub.vercel.app/](https://second-brain-hub.vercel.app/)

---

## 📖 Overview

**Second Brain** is a **self-hosted backend and sync system** built to extend the Focus To-Do web app.

After using Focus To-Do for **3+ years**, I hit a hard limitation:

* ❌ Free users are **locked to one device**
* ❌ Data is stored **only locally**
* ❌ No way to sync across devices without paid plans

So instead of migrating away, I **reverse-engineered the app’s data flow** and built a **fully working custom backend** that enables:

* ☁️ Cloud sync using MongoDB
* 🔄 Cross-device continuity
* 📴 Offline-first behavior (cloud as backup, not dependency)
* 🔐 Session-based authentication

⚠️ **Important:**
The **frontend UI is unchanged** (original Focus To-Do production bundle).
**All engineering work is backend, sync logic, and integration.**

---

## 🚀 What I Built (My Contribution)

### 🔧 Backend System (Core Work)

* Custom **Node.js + Express backend**
* MongoDB-based persistence layer
* Session-based authentication (Focus To-Do compatible)
* Sync APIs that match the original app’s expected format
* Data normalization to prevent UI crashes
* Cross-device data hydration

### 🔄 Sync Architecture

* Local-first (IndexedDB remains primary)
* Manual sync (explicit → no silent overwrites)
* Cloud used as **backup & transport**
* Handles:

  * tasks
  * projects
  * pomodoro logs
  * derived focus metrics

### 🛡️ Stability & Compatibility

* Preserves **original UI & UX**
* No frontend rewrites
* Works with legacy production React bundle
* Prevents:

  * blank UI after login
  * data loss after reload
  * corrupted sync states

---

## ✨ Features Enabled

### 📝 Tasks & Projects

* Full task lifecycle (create, edit, complete, archive)
* Projects & folders
* Priorities, tags, subtasks, notes
* Recurring tasks & deadlines

### 🍅 Pomodoro Tracking

* Focus sessions per task
* Estimated vs actual focus time
* Pomodoro history synced across devices

### ☁️ Cloud Sync

* MongoDB-backed storage
* Secure sessions
* Manual sync button
* Cross-device continuity

### 📴 Offline-First

* App works fully offline after load
* No cloud dependency for daily use
* Sync only when you choose

---

## 🏗️ Architecture

```
Frontend (unchanged)
 ├─ Production React bundle (Focus To-Do)
 ├─ IndexedDB (primary storage)
 └─ localStorage (session state)

Backend (custom)
 ├─ Node.js + Express
 ├─ Auth & session handling
 ├─ Sync APIs (Focus-compatible)
 └─ MongoDB Atlas (cloud backup)
```

**Design philosophy**

* Local-first
* Cloud as optional layer
* Zero UI breakage
* Full data ownership

---

## 🛠️ Tech Stack

### Backend (My Work)

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* express-session

### Frontend (Unmodified)

* React (production bundle)
* IndexedDB
* Vanilla JavaScript
* HTML5, CSS

### Deployment

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas

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

Open
👉 `http://localhost:5173`

---

## 📁 Project Structure

```
Second-Brain/
├── backend/        # Custom Node + Express backend
├── js/             # Frontend integration & interceptors
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

* GitHub: [https://github.com/itslokeshx](https://github.com/itslokeshx)
* Issues: Bug reports & feature requests

---

<div align="center">

**Built by Lokesh**
⭐ Star the repo if you value local-first software

</div>

