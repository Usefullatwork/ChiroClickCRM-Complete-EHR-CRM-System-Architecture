# Week Plan: Production-Ready + Portable by Friday

## Quick Reference

| Day             | Focus                                 | Key Deliverables                                        |
| --------------- | ------------------------------------- | ------------------------------------------------------- |
| **Mon (Day 1)** | AI Infrastructure + Portable Models   | `.env` fixed, `OLLAMA_MODELS` portable, AI working E2E  |
| **Tue (Day 2)** | Clean Install Mode + Training Data    | `INSTALL.bat`, `MAKE-CLEAN-COPY.bat`, v4 training data  |
| **Wed (Day 3)** | Train v4 + Deploy + Evaluate          | SFT training (~5-7h GPU), deploy to Ollama, eval vs v2  |
| **Thu (Day 4)** | Stability + Tests + i18n              | Fix 11 failing test suites, extract hardcoded strings   |
| **Fri (Day 5)** | E2E QA + Clean Install Test + Release | Full workflow test, clean install test, tag v1.0.0-beta |

## Project Location

```
C:\Users\MadsF\Desktop\ChiroClickCRM-Complete-EHR-CRM-System-Architecture
```

## Current State (as of 2026-02-23)

- **Best AI model**: `chiro-no-lora-v2` (79% eval pass rate)
- **App**: Builds clean, 589 frontend + 1720 backend tests
- **CI**: 5/5 GREEN, E2E 88/88
- **Backend test failures**: 11/65 suites (PGlite WASM + Ollama-dependent)
- **i18n gaps**: 75+ hardcoded Norwegian strings in ~20 components

## Critical Lessons (DO NOT REPEAT)

| Lesson                         | Detail                                                             |
| ------------------------------ | ------------------------------------------------------------------ |
| Dataset size != quality        | v2 (4,973) = 79%, v3 (10,955) = 55%                                |
| Never `--low-vram` on RTX 4070 | Causes 10x slowdown                                                |
| Always `--no-packing`          | Packing changes dynamics + OOMs                                    |
| ADAPTER > Merged GGUF          | Same quality, 4.8GB vs 15GB, 3.5s vs 22.5s                         |
| Never kill `nvcontainer.exe`   | NVIDIA CUDA runtime. Kill = 10x slowdown                           |
| Git on this repo               | Never `git add .` or `-A` (hangs). Never HEREDOC commits. Use `-m` |
| Ollama path (Git Bash)         | `/c/Users/MadsF/AppData/Local/Programs/Ollama/ollama.exe`          |
| Python prefix                  | `PYTHONIOENCODING=utf-8 PYTHONUNBUFFERED=1` always                 |
| `OLLAMA_MODELS`                | Set BEFORE starting Ollama to use local model storage              |

## Detailed Day Plans

- [Day 1 — AI Infrastructure + Portable Models](./DAY-1-AI-INFRASTRUCTURE.md)
- [Day 2 — Clean Install Mode + Training Data](./DAY-2-INSTALL-SCRIPTS.md)
- [Day 3 — Train v4 + Deploy + Evaluate](./DAY-3-TRAINING.md)
- [Day 4 — Stability + Tests + i18n](./DAY-4-STABILITY.md)
- [Day 5 — E2E QA + Release](./DAY-5-RELEASE.md)
- [Feedback Template for Friends](./FEEDBACK-TEMPLATE.md)
- [Feature: Anonymous Training Export](./FEATURE-ANONYMOUS-TRAINING-EXPORT.md) _(fit into Day 2 or Day 4, ~3h)_

## Key Corrections from Code Review

The original plan had a few inaccuracies. These are corrected in the day docs:

1. **Env var names**: Plan said `AI_MODEL_NORWEGIAN` — ai.js actually reads `AI_MODEL_SOAP`, `AI_MODEL_REDFLAGS`, `AI_MODEL_FAST`, `AI_MODEL_MEDICAL` (lines 156-159). Doesn't matter much since `MODEL_ROUTING` hardcodes the models anyway.

2. **`.env` current state**: Plan said `AI_ENABLED=false` — it's actually already `true` (line 21). The real problem is `AI_MODEL=chiro-no` instead of `chiro-no-lora-v2`.

3. **`RAG_ENABLED`**: Plan doesn't mention it defaults to `true` in ai.js (line 153: `!== 'false'`). Must explicitly set `RAG_ENABLED=false` since RAG requires pgvector (not available in PGlite desktop mode).

4. **START-CHIROCLICK.bat Ollama spawn**: Just setting `set OLLAMA_MODELS=...` isn't enough — the `start "" ollama serve` spawns a new process. Must pass the env var into the child process.

## Portability Architecture

```
ChiroClickCRM/
├── INSTALL.bat              ← Friend runs this first
├── START-CHIROCLICK.bat     ← Then this to start
├── MAKE-CLEAN-COPY.bat      ← You run this to create shareable copy
├── FEEDBACK.md              ← Give to friends
├── backend/
│   ├── .env                 ← YOUR config (excluded from clean copy)
│   └── .env.example         ← Template for fresh installs
├── data/
│   ├── ollama/              ← Portable AI models (~5-14GB)
│   ├── pglite/              ← YOUR patient data (excluded from clean copy)
│   ├── uploads/             ← Patient documents (excluded)
│   └── backups/             ← DB backups (excluded)
├── database/
│   ├── schema.sql           ← Auto-applied on first start
│   └── seeds/               ← Demo data auto-applied
└── ai-training/
    ├── data/mined/          ← Raw training data (included)
    └── models/gguf/         ← Modelfiles for Ollama (included)
```
