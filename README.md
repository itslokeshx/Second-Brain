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
- **🌍 Internationalization**: Multi-language support.

## 🚀 Live Demo

Deployed on Netlify: **[Insert Your Netlify Link Here]**

## 🛠️ Installation & Local Development

Due to modern browser security policies (CORS), this application **cannot** be run by simply opening `index.html` file. It requires a local web server to load audio assets correctly.

### Prerequisites

- **Python 3** (Pre-installed on macOS/Linux)
- OR **Node.js** (optional, if you prefer `http-server`)

### Quick Start (Python)

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/second-brain.git
    cd second-brain
    ```

2.  Start the local server:
    ```bash
    python3 -m http.server 8008
    ```

3.  Open code in your browser:
    [http://localhost:8008](http://localhost:8008)

## 📂 Project Structure

```
second-brain/
├── assets/
│   ├── audio/      # Background sounds & alarms
│   └── ...
├── i18n/           # Translation files
├── js/
│   ├── main.js     # Application logic
│   └── ...
├── main.css        # Styling
└── index.html      # Entry point
```

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
