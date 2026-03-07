---
name: worktree-workflow
description: Git worktree isolation for parallel agent work. Activates when agents need to modify the same files or when file isolation is required.
allowed-tools: Read, Bash(git worktree *), Bash(git branch *), Bash(git merge *), Bash(git diff *), Bash(ls *)
---

# Git Worktree Isolation

Creates isolated copies of the repository for parallel agent work without cross-contamination.

## When to Use

- Two or more agents need to modify overlapping files
- High-risk changes that should be verified before merging into the main working tree
- Testing changes in isolation without affecting the main branch

## Setup

### Create a Worktree
```bash
git worktree add ../chiroclickehr-worktree-{task} -b worktree/{task}
```

### Port Isolation (ChiroClickEHR-specific)
Main tree uses ports 3000 (backend) and 5173 (frontend).
Worktrees MUST use different ports:
- Worktree 1: backend=3001, frontend=5174
- Worktree 2: backend=3002, frontend=5175

Set via environment variables:
```bash
PORT=3001 VITE_PORT=5174
```

## Agent Dispatch

When spawning an agent into a worktree:
1. Pass the worktree path as the working directory
2. Include port configuration in agent instructions
3. Remind agent NOT to commit to main — only to the worktree branch

## Merge Back

After agent completes:
1. Review changes: `git diff main..worktree/{task}`
2. Run tests in the worktree
3. If tests pass: `git merge worktree/{task}` (from main tree)
4. If tests fail: fix in worktree, re-test, then merge

## Cleanup

```bash
git worktree remove ../chiroclickehr-worktree-{task}
git branch -d worktree/{task}
```

## Anti-Patterns

- Never leave worktrees around after task completion
- Never run `npm install` in worktrees (shares node_modules with main via symlink)
- Never merge without running tests first
