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

### Database errors on startup

- The app auto-recovers from most database issues
- If persistent: rename `%APPDATA%\chiroclickehr-desktop\data\pglite\` and restart (creates fresh database)
- Restore your data from a backup after reinitialization

### Slow performance

- Close other heavy applications (browser tabs, IDEs)
- PGlite runs entirely in-memory — more RAM helps

### GPU cache warnings in console

- "Unable to create cache" messages are harmless Chromium warnings
- They do not affect functionality

## Updating

1. Download the new version
2. Replace the old `.exe` file
3. Launch — your data is preserved (stored in AppData, not alongside the exe)

## Uninstalling

1. Delete the `.exe` file
2. To remove all data: delete `%APPDATA%\chiroclickehr-desktop\`
