---
description: Curates auto-memory files. Prunes stale entries, moves detailed content to topic files, keeps MEMORY.md under 200 lines.
---

Curate the auto-memory directory at `C:\Users\MadsF\.claude\projects\C--Users-MadsF\memory\`.

## Steps

1. Read `MEMORY.md` and count total lines
2. Read all topic files in the memory directory
3. Identify stale entries:
   - Session learnings older than 60 days without recent reference
   - Duplicate information across MEMORY.md and topic files
   - Information that contradicts current project state
4. For entries worth keeping but too detailed for MEMORY.md:
   - Move to appropriate topic file (create if needed)
   - Leave a one-line reference in MEMORY.md linking to the topic file
5. Remove entries that are:
   - Outdated (project has moved past this)
   - Duplicated in CLAUDE.md or project docs
   - No longer accurate
6. Verify MEMORY.md is under 200 lines after cleanup
7. Report: lines before, lines after, entries pruned, entries moved

## Rules

- NEVER delete entries about active projects (ChiroClickEHR, TheBackROM, EcoSeal)
- NEVER delete lessons learned (LESSON: entries) unless they're demonstrably wrong
- ASK before deleting anything that looks like it might still be relevant
- Prefer moving to topic files over deletion
