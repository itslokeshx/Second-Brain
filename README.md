# Second Brain

A comprehensive web-based Pomodoro timer and task management application designed to help you stay focused and organized.

## Features

- **Pomodoro Timer**: Customizable work/break intervals to maximize productivity.
- **Task Management**: Organize tasks into projects, set priorities, and track deadlines.
- **Reports**: Visualize your focus time and task completion history.
- **Background Sounds**: White noise and ambient sounds to block out distractions.
- **Data Sync**: (Optional) Account synchronization features.

## Installation & Usage

> [!IMPORTANT]
> **Audio Playback Requirement**: Due to modern browser security policies (CORS), audio files will not play if you open `index.html` directly from your file system. You **must** run a local web server.

### Prerequisites
- Python 3 (pre-installed on most Linux/macOS systems)
- Or any other static file server (e.g., `http-server` via npm, VS Code Live Server)

### Running Locally

1. Open your terminal in the project directory.
2. Start a simple HTTP server using Python:

   ```bash
   python3 -m http.server 8008
   ```

3. Open your browser and navigate to:
   
   [http://localhost:8008](http://localhost:8008)

## Technologies

- **HTML5**: semantic structure.
- **CSS3**: Custom styling (`main.css`).
- **JavaScript**: Core logic (`main.js`) handling timer, tasks, and audio.

## License

Distributed under the MIT License. See `LICENSE` for more information.
