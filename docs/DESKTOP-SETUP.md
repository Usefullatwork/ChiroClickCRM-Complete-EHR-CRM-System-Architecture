# ChiroClickEHR Desktop — Setup Guide

## System Requirements

- **OS**: Windows 10/11 (64-bit)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk**: 500 MB for the application + space for patient data
- **Optional**: [Ollama](https://ollama.com) for AI-assisted SOAP notes and clinical suggestions

## Installation

1. Download `ChiroClickEHR 2.0.0.exe` (portable — no installer needed)
2. Place it in a folder of your choice (e.g., `C:\ChiroClickEHR\`)
3. Double-click to launch

The first launch takes ~10 seconds longer while the database initializes.

## First Run

On first launch:

1. A splash screen shows "Initializing database..."
2. The backend server starts on port 3000
3. The Setup wizard appears — follow the prompts to:
   - Set your clinic name and details
   - Create your practitioner account
   - Configure basic settings

## Data Location

All patient data is stored locally on your machine:

```
%APPDATA%\chiroclickehr-desktop\data\
├── pglite/     ← Database (patient records, appointments, etc.)
├── backups/    ← Database backups
├── uploads/    ← Uploaded files (images, documents)
├── exports/    ← Data exports (SQL, CSV)
├── logs/       ← Application logs
└── temp/       ← Temporary files
```

> **Your data never leaves your machine.** There is no cloud component.

## Backup

### Manual Backup

1. **File menu → Export Data** (Ctrl+Shift+E)
2. Choose a save location (USB drive, external disk, cloud sync folder)
3. Save the `.sql` file

### Restore from Backup

1. **File menu → Import Data** (Ctrl+Shift+I)
2. Select the `.sql` backup file
3. Confirm the restore

### Recommended Schedule

- **Daily**: Export to a USB drive or synced cloud folder
- **Weekly**: Copy the entire `%APPDATA%\chiroclickehr-desktop\data\` folder to an external drive

## AI Features (Optional)

ChiroClickEHR can use local AI models via Ollama for:

- SOAP note suggestions
- Clinical red flag detection
- Treatment recommendations
- Patient communication drafts

### Setting Up Ollama

1. Install [Ollama](https://ollama.com/download) for Windows
2. Open a terminal and run:
   ```
   ollama pull chiro-no-sft-dpo-v6
   ```
3. Ollama runs on port 11434 — ChiroClickEHR detects it automatically
4. If Ollama is not running, all features work normally without AI suggestions

## Troubleshooting

### App won't start

- Check if another application is using port 3000
- Try closing all Node.js processes in Task Manager, then restart
- On Windows: `taskkill /F /IM node.exe` then relaunch

### Database errors on startup

- The app auto-recovers from most database issues
- If persistent: rename `%APPDATA%\chiroclickehr-desktop\data\pglite\` and restart (creates fresh database)
- Restore your data from a backup after reinitialization

### Slow performance

- Close other heavy applications (browser tabs, IDEs)
- PGlite runs entirely in-memory — more RAM helps
- If the app becomes sluggish with many patients (>5000), consider exporting old data

### GPU cache warnings in console

- "Unable to create cache" messages are harmless Chromium warnings
- They do not affect functionality

### White screen on startup

- The backend takes 5-15 seconds to initialize on first launch
- Wait for the splash screen to finish — do not force-close
- If white screen persists after 30 seconds: close and relaunch
- Check if antivirus software is blocking Node.js

### Ollama AI not connecting

- Verify Ollama is running: open a terminal and run `ollama list`
- Ollama must be on port 11434 (default)
- If you changed the Ollama port, set `OLLAMA_HOST` environment variable
- Firewall may block localhost connections — allow Node.js through Windows Firewall
- The app works normally without Ollama; AI features are optional

### Data folder permission errors

- The data folder requires write access: `%APPDATA%\chiroclickehr-desktop\data\`
- Run the app as your normal user (not as Administrator)
- If using a managed PC: ask IT to grant write access to the AppData folder
- Corporate group policies may restrict AppData writes — contact your IT department

### Export/import not working

- Ensure you have write access to the destination folder
- Export creates a `.sql` file — do not rename the extension
- Import only accepts `.sql` files created by ChiroClickEHR export
- Large databases (>100MB) may take a few minutes to export

### Crash recovery

- If the app crashes, your data is safe — PGlite uses WAL (write-ahead log)
- Simply relaunch the app; it will recover automatically
- If data appears corrupted after a crash: restore from your latest backup
- Crash logs are saved to `%APPDATA%\chiroclickehr-desktop\data\logs\`

### Multiple instances

- Only one instance of ChiroClickEHR can run at a time
- If you see "port 3000 already in use": close the other instance first
- Check Task Manager for orphan `ChiroClickEHR` or `node.exe` processes

### High memory usage

- ChiroClickEHR typically uses 300-500 MB of RAM
- PGlite keeps the database in memory for performance
- Memory usage grows with the number of open tabs/patients
- Close unused patient tabs to free memory
- If usage exceeds 1 GB: restart the app

## Updating

1. Download the new version
2. Replace the old `.exe` file
3. Launch — your data is preserved (stored in AppData, not alongside the exe)

## Uninstalling

1. Delete the `.exe` file
2. To remove all data: delete `%APPDATA%\chiroclickehr-desktop\`
