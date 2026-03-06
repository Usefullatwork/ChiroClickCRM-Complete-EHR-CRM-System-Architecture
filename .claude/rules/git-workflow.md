# Git Workflow

## Branching
- Feature branches only: `feature/description`, `fix/description`, `refactor/description`
- Never commit directly to main (PreToolUse hook blocks this)
- One logical change per commit

## Commits
- Use `-m` flag (HEREDOC hangs on Windows MSYS)
- Imperative mood: "Add patient export" not "Added patient export"
- Stage files by name: `git add backend/src/file.js frontend/src/file.jsx`
- NEVER use `git add .` or `git add -A` (timeouts on large repo, risk of staging secrets)

## Before Committing
- Run relevant tests (backend/frontend/both)
- Verify build succeeds (`cd frontend && npm run build`)
- Check for console.log (pre-commit hook catches this)
- Check for uncommitted .env files

## Commit Message Format
```
<type>: <short description>

[optional body explaining why, not what]

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: feat, fix, refactor, test, docs, chore, perf
