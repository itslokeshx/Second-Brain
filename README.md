<div align="center">

# 🧠 Second Brain

### 🗂️ Open Local-First Productivity System with Cloud Backup & Corruption-Safe Persistence

**🔧 Independent re-engineering of the Focus To-Do UI into an open offline-first architecture**

🌐 **Live App:**
👉 [https://second-brain-hub.vercel.app/](https://second-brain-hub.vercel.app/)

</div>

---

## 🚨 Why Second Brain Exists

For years I relied on Focus To-Do to track my study life.
But I repeatedly lost **months and years of focus history** because of:

* 💾 Local-only storage
* 💰 Paid cloud sync
* 💥 OS corruption wiping data

So Second Brain was built with one goal:

> 🛡️ **Your productivity history must never be lost again.**

Second Brain is a **personal productivity vault**, not a subscription service.

---

## 🧩 What Makes It Different

| Capability                     | Second Brain       |
| ------------------------------ | ------------------ |
| 🌐 Offline-first               | Always             |
| ☁️ Free unlimited cloud backup | Yes                |
| 🛡️ Corruption-safe sync       | Triple-layer guard |
| 💳 Subscription                | Never              |
| 👤 Data ownership              | 100% yours         |

---

## ✨ Core Capabilities

### 📝 Tasks & Projects

* 📁 Projects and folders
* 🎯 Priority levels & deadlines
* 📆 Smart system views (Today, Upcoming, Overdue, History)
* 📜 Chronological task history

### ⏱️ Focus Engine

* 🍅 Pomodoro sessions
* ☕ Break management
* 📊 Long-term focus logs

### ☁️ Cloud Sync

* 🗄️ MongoDB cloud backup
* 🔄 Conflict-safe merging
* 🧬 Auto hydration recovery
* 🌍 Multi-device support

---

## 🛡️ Bulletproof Persistence Engine

Second Brain includes a **three-layer corruption prevention system**:

| Layer                  | Purpose                           |
| ---------------------- | --------------------------------- |
| 🧱 Write Interceptor   | Blocks destructive overwrites     |
| 🔁 Atomic Cursor Merge | Prevents race-condition sync bugs |
| ⏳ Debounce Guard       | Stops rapid-fire corruption       |

This prevents schema drift, hydration loops, and sync-time data loss.

---

## 🏗️ System Architecture

```
🖥️ UI (React bundle)
      ↓
🛡️ Integrity Guard Layer
      ↓
📦 IndexedDB (primary local store)
📦 localStorage (secondary backup)
      ↓
🔄 Sync Orchestrator
      ↓
🧠 Node.js API
      ↓
☁️ MongoDB Cloud
```

---

## 🛠️ Tech Stack

### Frontend

* ⚙️ Vanilla JS + bundled React
* 📦 IndexedDB
* 🧰 localStorage (fallback)

### Backend

* 🧠 Node.js
* 🚏 Express
* 🗄️ MongoDB + Mongoose
* 🔐 Session-based authentication

---

## 🚀 Installation

```bash
git clone https://github.com/yourname/second-brain
cd backend
npm install
npm run dev
```

Serve frontend:

```bash
npx serve .
```

Open:

```
http://localhost:8000
```

---

## ⚖️ Attribution

The UI layer is based on the Focus To-Do client.
All persistence, sync, backend and integrity systems are original.

---

## 👤 Who This Is For

* 🎓 Students protecting long-term study history
* 👨‍💻 Developers who value local-first systems
* 😤 Anyone tired of losing data to subscriptions

---

## 📄 License

MIT

---

<div align="center">

### Made with ❤️ by **Loki**

⭐ If you find this useful, consider giving the repository a star!

</div>
