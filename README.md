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

| Layer                  | Purpose                           |
| ---------------------- | --------------------------------- |
| 🧱 Write Interceptor   | Blocks destructive overwrites     |
| 🔁 Atomic Cursor Merge | Prevents race-condition sync bugs |
| ⏳ Debounce Guard       | Stops rapid-fire corruption       |

---

## 🏗️ Architecture & File Structure

### High-Level Architecture


```
UI (React bundle)
   ↓
Integrity Guard Layer
   ↓
IndexedDB (Primary Store)
localStorage (Backup)
   ↓
Sync Orchestrator
   ↓
Node.js API
   ↓
MongoDB Cloud
```

---

### 📁 Project Structure

```
Second-Brain/
├── backend/           # Express + MongoDB API
├── js/                # Frontend runtime & sync engine
├── css/               # UI styles
├── assets/            # Fonts, audio, images
├── index.html
├── main.css
└── vercel.json / render.yaml
```

---

### 🎨 Frontend Runtime Flow

1. Load HTML
2. Initialize protection guards
3. Validate IndexedDB
4. Hydrate Redux
5. Render UI
6. App works offline

---

### 🔧 Backend Request Flow

Request → CORS → Session → CookieParser → Auth → Routes → Response


---

## 🛠️ Tech Stack

**Frontend**

* React (bundled)
* Redux
* IndexedDB
* localStorage

**Backend**

* Node.js
* Express
* MongoDB
* Mongoose
* bcrypt
* express-session

---

## ⚖️ Attribution

UI based on Focus To-Do client.
All persistence, sync, backend, and integrity systems are original.

---

## 👤 Who This Is For

- 🎯 People who take productivity seriously  
- 🧠 Users who want permanent ownership of their data  
- 😤 Anyone tired of losing productivity data

---

<div align="center">

### Made with ❤️ by **Loki**

⭐ Star the repo if this helped you!

</div>

