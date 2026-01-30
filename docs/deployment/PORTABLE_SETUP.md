# Portable Installation Guide (USB Setup)

To run ChiroClick CRM entirely from this drive (USB/External SSD) without installing anything on the host computer, please follow these steps to place the necessary files in the right folders.

## 1. Directory Structure
The script has created a `bin` and `data` folder. Your drive should look like this:
```
F:\
  ├── ChiroClickCRM-Complete-EHR-CRM-System-Architecture\
  ├── bin\
  │   ├── ollama\       <-- You put ollama.exe here
  │   └── pgsql\        <-- You put PostgreSQL binaries here
  ├── data\             <-- All database and AI data will be stored here
  └── START-CHIROCLICK.bat
```

## 2. Download & Place Files

### Step A: PostgreSQL (The Database)
1. Download the **PostgreSQL Windows Binaries** (ZIP version, not the installer):
   - [Download Link (EnterpriseDB)](https://get.enterprisedb.com/postgresql/postgresql-15.6-1-windows-binaries.zip)
2. Extract the ZIP file.
3. It will contain a folder named `pgsql`.
4. Move that entire `pgsql` folder into the `bin` folder on this drive.
   - Correct path: `F:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\bin\pgsql\bin\pg_ctl.exe`

### Step B: Ollama (The AI)
1. Download **Ollama for Windows**: [Download Link](https://ollama.com/download/windows)
2. The download is an installer (`.exe`). You can install it on *your* machine just to get the `ollama.exe` file, or copy it from a machine that has it.
   - Usually found at: `C:\Users\YourUser\AppData\Local\Programs\Ollama\ollama.exe`
3. Copy `ollama.exe` into:
   - `F:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\bin\ollama\`

## 3. Launching
1. Double-click `START-CHIROCLICK.bat`.
2. It will detect the files.
3. On the first run, you'll be prompted to set up the Multi-Model AI System:

### Multi-Model AI System

ChiroClick uses 4 specialized AI models for different tasks:

| Model | Base | Size | Purpose |
|-------|------|------|---------|
| `chiro-no` | Mistral 7B | ~4GB | Default - general clinical tasks |
| `chiro-fast` | Llama 3.2 3B | ~2GB | Quick autocomplete |
| `chiro-norwegian` | Viking 7B | ~4GB | Norwegian language |
| `chiro-medical` | MedGemma 4B | ~3GB | Clinical reasoning |

**Options on first launch:**
- **[B] Build all models** - Downloads ~13GB, builds all 4 specialized models
- **[M] Minimal setup** - Downloads ~4GB, builds only `chiro-no` (balanced)
- **[S] Skip** - Start without AI (can run `ai-training\build-model.bat` later)

All model data is stored on the portable drive (`data\ollama_models`).

## 4. Updates
- If you move this drive to another computer, everything travels with it.
- NO data is left on the host computer.
