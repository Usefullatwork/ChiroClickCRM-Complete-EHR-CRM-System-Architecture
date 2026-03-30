---
name: backup
description: Create a timestamped backup of the PGlite database directory.
---

Create a backup of the PGlite database.

## 1. Check PGlite State

Run `bash scripts/check-pglite.sh` first. If data dir is empty or corrupted, warn the user — no point backing up bad data.

## 2. Create Backup

```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="data/backups/pglite-${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"
cp -r data/pglite/* "$BACKUP_DIR/"
```

## 3. Verify Backup

Check the backup has a PG_VERSION file:

```bash
ls -la "$BACKUP_DIR/PG_VERSION"
du -sh "$BACKUP_DIR"
```

## 4. Report

Tell the user:

- Backup location: `data/backups/pglite-{timestamp}/`
- Backup size
- List existing backups: `ls data/backups/`
