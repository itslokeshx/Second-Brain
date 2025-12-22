# Second Brain 🧠

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Web Access](https://img.shields.io/badge/web-PWA-orange)

**Second Brain** is a comprehensive personal productivity dashboard designed to help you organize your time and tasks. Merging the focus-enhancing power of a Pomodoro timer with a robust task management system, it serves as your digital cognitive extension.

## ✨ Features

- **🍅 Pomodoro Timer**: Customizable work/break intervals to maximize your focus efficiency.
- **✅ Task Management**: Create tasks, set priorities, and organize them into projects.
- **🎧 Ambient Soundscapes**: Built-in white noise and background sounds (Rain, Forest, Cafe) to block distractions.
- **📊 Productivity Reports**: Visualize your focus hours and task completion trends.


## 📂 Project Structure

```
second-brain/
├── assets/
│   ├── audio/          # Background sounds & alarms
│   ├── font/           # Custom fonts
│   └── img/            # Images and icons
├── backend/
│   ├── middleware/     # Express middleware (auth, etc.)
│   ├── models/         # MongoDB schemas (User, Project, Task, etc.)
│   ├── routes/         # API routes (auth, sync, legacy)
│   ├── scripts/        # Database utility scripts
│   ├── utils/          # Helper functions
│   ├── db.js           # Database connection
│   ├── server.js       # Express server entry point
│   └── package.json    # Backend dependencies
├── js/
│   ├── main.js         # Core application logic
│   ├── i18n.js         # Internationalization
│   ├── session-manager.js  # User session management
│   ├── sync-service.js     # MongoDB sync service
│   └── chrome-polyfill.js  # Browser API polyfills
├── main.css            # Application styles
├── index.html          # Entry point
└── README.md
```

## 🔧 Development Setup

### Frontend
The frontend is a single-page application that runs in the browser.

1. Start a local web server:
   ```bash
   python3 -m http.server 8008
   ```

2. Open in your browser:
   [http://localhost:8008](http://localhost:8008)

### Backend (MongoDB)
The backend provides authentication and cloud sync functionality.

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Configure environment variables:
   Create a `.env` file in the `backend/` directory:
   ```
   MONGODB_URI=mongodb://localhost:27017/second-brain
   JWT_SECRET=your-secret-key-here
   PORT=3000
   ```

3. Start the backend server:
   ```bash
   npm start
   ```

The backend will run on `http://localhost:3000`.

### Database Utilities
See [`backend/scripts/README.md`](backend/scripts/README.md) for database management scripts.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for productivity enthusiasts.*
