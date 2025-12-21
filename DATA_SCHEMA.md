# 💾 Data Storage & Database Schema

## Storage Mechanism
This application is a **Client-Side SPA (Single Page Application)**. It does not use a traditional relational database (SQL) or NoSQL database (MongoDB) on the backend for its primary operations. Instead, it relies on the browser's persistent storage.

### Primary Storage: `localStorage`
The application uses the browser's `window.localStorage` to persist data. This means:
-   **Data Location**: All data is stored in your web browser's profile folder.
-   **Persistence**: Data survives page reloads and browser restarts.
-   **Limits**: Typical browser limit is ~5-10MB (UTF-16 text).
-   **Privacy**: Data stays on your device unless the "Sync" feature is explicitly used.

### Sync Mechanism (Optional/Partial)
The code contains logic for Cloud Sync (WebSocket/API calls to `focustodo.net`), but in this local build, it acts primarily as a local-first app. Local changes are optimistically saved to `localStorage`.

---

## 🗄️ JSON Data Schema
Since `localStorage` stores strings (Key-Value pairs), the "Database" is a collection of JSON strings. Below is the reconstructed schema based on the application code (`main.js`).

### 1. `Project` Object
Projects serve as containers for tasks.
```json
{
  "id": "string (UUID)",
  "name": "string (e.g., 'Work', 'Personal')",
  "color": "string (Hex Code, e.g., '#fd5553')",
  "order": "number (Sort order)",
  "type": "string (e.g., 'folder', 'project')",
  "parentId": "string (UUID of parent folder, or empty)",
  "estimatedTime": "number (Total pomodoros)",
  "spentTime": "number (Completed pomodoros)"
}
```

### 2. `Task` Object
The core unit of work.
```json
{
  "id": "string (UUID)",
  "parentId": "string (Project ID)",
  "name": "string",
  "note": "string (Optional description)",
  "priority": "number (0=None, 1=Low, 2=Medium, 3=High)",
  "status": "string ('todo', 'done')",
  "estimatedPomodoros": "number",
  "actPomodoros": "number (Actual completed)",
  "dueDate": "ISO8601 String / Timestamp",
  "createdTime": "Timestamp"
}
```

### 3. `Settings / User Config`
Stored as individual keys or a configuration object.
-   `BgMusic`: String (Current background sound file, e.g., `bgm_Rain.m4a`)
-   `Volume`: Number
-   `TimerSettings`: JSON Object (Work duration, Break duration)

### 4. `PomodoroLog` (History)
Records specific focus sessions.
```json
{
  "id": "string",
  "taskId": "string",
  "startTime": "Timestamp",
  "endTime": "Timestamp",
  "duration": "number (minutes)",
  "status": "string ('completed', 'abandoned')"
}
```

---

## ⚠️ Important Considerations
1.  **Data Loss Risk**: Clearing your browser's "Cache & Site Data" **WILL DELETE ALL YOUR DATA**.
2.  **Backups**: Since there is no automatic cloud backup (unless you configure the sync server), you should rely on exporting data if the feature is available.
3.  **Cross-Browser**: Data in Chrome is not visible in Firefox. It is siloed per browser.
