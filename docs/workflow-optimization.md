# Claude Code Optimization Kit — Full Implementation Prompt

> Copy this entire document into a new Claude Code session. It contains every file, every hook, and every line needed. No external dependencies.

---

## Instructions for Claude

Implement all of the following in the current project. Create every file listed below with the exact content provided. Modify `settings.json` and `.gitignore` as specified. This is a complete, self-contained optimization package.

**Do all work on a feature branch:** `git checkout -b feature/claude-code-optimization`

---

## STEP 1: Modify `.claude/settings.json`

**What to change:**

1. **Remove redundant Bash allow-list patterns.** If you already have `Bash(npm run *)`, remove any pattern it covers: `npm run lint*`, `npm run swagger*`, `npm run build*`, `npm run dev*`, `npm start*`, and all `cd X && npm run Y*` variants of these. Also remove `Bash(cat *)`, `Bash(grep *)`, `Bash(find *)`, `Bash(sleep *)` — Claude Code has dedicated Read/Grep/Glob tools.

2. **Add these 3 new hooks** to the existing hooks object (merge with any existing hooks, don't replace them):

### Hook A: Plan Injection (PreToolUse, matcher: "Edit|Write")

Add this hook entry to PreToolUse. If there's already a PreToolUse matcher for "Edit|Write", add this as a second hook in the same hooks array:

```json
{
  "type": "command",
  "command": "if [ -f .planning/task_plan.md ]; then head -30 .planning/task_plan.md 2>/dev/null | sed 's/\"/\\\\\"/g' | { CONTENT=$(cat); echo \"{\\\"systemMessage\\\":\\\"ACTIVE PLAN: $CONTENT\\\"}\"; }; fi",
  "timeout": 3
}
```

### Hook B: Tool-Call Counter (PostToolUse, matcher: ".\*")

Add this as a new PostToolUse entry:

```json
{
  "matcher": ".*",
  "hooks": [
    {
      "type": "command",
      "command": "CF=/tmp/claude_tc; C=$(cat $CF 2>/dev/null||echo 0); C=$((C+1)); echo $C>$CF; [ $C -eq 40 ] && echo '{\"systemMessage\":\"40 tool calls. Consider /save-state then /compact at next logical boundary.\"}'; [ $C -eq 60 ] && echo '{\"systemMessage\":\"60 tool calls. Context degradation likely. Run /save-state NOW.\"}'",
      "timeout": 2
    }
  ]
}
```

### Hook C: Verification Failure Gate (PostToolUse, matcher: "Bash")

Add this as a new PostToolUse entry:

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "if [ \"$CLAUDE_TOOL_USE_EXIT_CODE\" != \"0\" ] && echo \"$CLAUDE_TOOL_INPUT\" | grep -qE '(npm test|npx vitest|npm run build|npx playwright)'; then echo '{\"systemMessage\":\"VERIFICATION FAILED. Do NOT proceed. Diagnose first. After 3 failures on same issue, stop and ask user.\"}'; fi",
      "timeout": 3
    }
  ]
}
```

---

## STEP 2: Model Routing on Agents

For every agent file in `.claude/agents/` that does **implementation work** (coding, testing, QA — NOT security review), add this line to the YAML frontmatter:

```yaml
model: claude-sonnet-4-6
```

Keep `model: claude-opus-4-6` (or add it) for any agent doing security review, compliance scanning, or code review.

**Example — before:**

```yaml
---
name: backend-dev
description: Backend development specialist
tools: Read, Edit, Write, Bash, Grep, Glob
---
```

**Example — after:**

```yaml
---
name: backend-dev
description: Backend development specialist
model: claude-sonnet-4-6
tools: Read, Edit, Write, Bash, Grep, Glob
---
```

---

## STEP 3: Add `.planning/` to `.gitignore`

Append to the project's `.gitignore`:

```
# Ephemeral planning files (session-specific, not source code)
.planning/
```

---

## STEP 4: Create Planning Templates

### File: `.planning/task_plan.md`

```markdown
# Task Plan

## Goal

<!-- What are we trying to achieve? -->

## Phases

<!-- Break into 2-3 phases max -->

### Phase 1:

- [ ] Task A
- [ ] Task B

### Phase 2:

- [ ] Task C

## Constraints

<!-- What must NOT change? What are the boundaries? -->

## Done When

<!-- How do we verify success? -->

- [ ] Tests pass
- [ ] Build succeeds
- [ ] Specific behavior verified
```

### File: `.planning/findings.md`

```markdown
# Findings

## Architecture Notes

<!-- Key patterns discovered during research -->

## Decisions

<!-- Design decisions made and why -->

## Dependencies

<!-- Files/modules that interact with our changes -->
```

### File: `.planning/progress.md`

```markdown
# Progress Log

<!-- Timestamped log of actions, test results, errors -->
<!-- Format: [HH:MM] Action — Result -->
```

---

## STEP 5: Create Commands

### File: `.claude/commands/save-state.md`

```markdown
Save current session state to disk before /compact.

## Steps

1. Read the current `.planning/task_plan.md` and update it with:
   - Which tasks are done (check them off)
   - Which task is currently in progress
   - Any new tasks discovered during execution

2. Read `.planning/findings.md` and append any new:
   - Architecture discoveries
   - Design decisions made
   - File dependencies identified

3. Read `.planning/progress.md` and append a timestamped summary:
   - What was accomplished since last save
   - Current test status (pass/fail counts)
   - Any errors or blockers encountered
   - What the next step should be

4. Run `git status` and note any uncommitted changes

5. Confirm: "State saved. Safe to /compact now."
```

### File: `.claude/commands/resume.md`

```markdown
Restore context after /compact or fresh session start.

## Steps

1. Read `.planning/task_plan.md` — understand the goal, phases, and current progress
2. Read `.planning/findings.md` — restore architecture context and decisions
3. Read `.planning/progress.md` — understand what happened recently and what's next
4. Run `git status` and `git log --oneline -5` — understand current repo state
5. Run `bash scripts/session-catchup.sh` if it exists — get system health snapshot

## Output

Summarize in this format:

RESUMING SESSION
Goal: [from task_plan]
Progress: [X/Y tasks done]
Last action: [from progress log]
Next step: [from task_plan]
Git state: [branch, uncommitted changes]
Health: [test status if available]

Then proceed with the next unchecked task from the plan.
```

### File: `.claude/commands/reboot.md`

```markdown
5-Question context recovery test. Use when context feels degraded or after multiple compactions.

## The 5 Questions

Answer each question. If you cannot answer confidently, STOP and research before continuing.

1. **Where am I?** — What branch? What directory? What's the repo state?
2. **Where am I going?** — What's the current goal? Read `.planning/task_plan.md`
3. **What's the goal?** — Why are we doing this? What problem does it solve?
4. **What have I learned?** — Read `.planning/findings.md` and `.planning/progress.md`
5. **What's done?** — Which tasks are completed? Which remain?

## Recovery Steps

1. Run `bash scripts/session-catchup.sh` if it exists
2. Read all 3 `.planning/` files
3. Answer the 5 questions above
4. If any answer is "I don't know" — ask the user before proceeding
5. If all 5 are answered — state next action and continue

## When to Suggest Fresh Session

If after recovery you still feel uncertain about the plan, suggest:
"Context may be too degraded. Consider starting a fresh session with /resume."
```

### File: `.claude/commands/dev-task.md`

```markdown
Dispatch a single development task to a fresh subagent with isolated context.

## Usage

`/dev-task "description of the task"`

$ARGUMENTS

## How It Works

1. Read `CLAUDE.md` for project context
2. Read `.planning/task_plan.md` if it exists (for current plan awareness)
3. Spawn a subagent with ONLY the task description + project context
4. The subagent gets fresh context (no accumulated pollution from this session)
5. Wait for result, then verify:
   - Did the subagent complete the task?
   - Do tests still pass?
   - Any unexpected side effects? (`git diff --stat`)

## Subagent Instructions Template

You are working on this project. Read CLAUDE.md first for project context.

YOUR TASK: [task description]

RULES:

- Read relevant files before editing
- Run tests after changes
- Stage changed files by name (not git add .)
- Do not modify files outside the scope of this task

## After Completion

Report: task description, files changed, test results, any issues found.
```

### File: `.claude/commands/parallel.md`

```markdown
Dispatch multiple independent tasks to parallel subagents.

## Usage

`/parallel "task1" "task2" "task3"`

$ARGUMENTS

## How It Works

1. Parse the argument into separate task descriptions
2. Verify tasks are truly independent (no shared file modifications)
3. Spawn one subagent per task, all in parallel with `run_in_background: true`
4. Each subagent gets:
   - Fresh context (CLAUDE.md + task description only)
   - Isolated scope (only modify files relevant to their task)
5. Wait for ALL results to return
6. Verify each result:
   - Task completed successfully?
   - No conflicting file changes across agents?
   - Tests still pass?

## Conflict Detection

Before spawning, check for overlapping files:

- If two tasks might edit the same file, run them sequentially instead
- If tasks are in different directories (backend/ vs frontend/), they're safe to parallelize

## After Completion

Report summary:

PARALLEL RESULTS (N tasks)

1. [task] — OK/FAILED — [files changed]
2. [task] — OK/FAILED — [files changed]
   Conflicts: none / [list]
   Tests: passing / failing
```

### File: `.claude/commands/finish-branch.md`

```markdown
Pre-merge checklist for the current feature branch.

## Steps

1. **Run all tests** (adapt commands to your project's test runner)

2. **Check for debug artifacts:**
   - Search for `console.log` in source files
   - Search for `TODO`, `FIXME`, `HACK`, `XXX` in source files

3. **Verify build** (if applicable)

4. **Show summary:**
   - Branch name and commit count vs main
   - Files changed (`git diff --stat main`)
   - Test results (pass/fail counts)
   - Any warnings found in step 2

5. **Present options:**

   Only if ALL tests pass and build succeeds:
   - **A) Squash merge** — `git checkout main && git merge --squash <branch> && git commit`
   - **B) Regular merge** — `git checkout main && git merge <branch>`
   - **C) Push for PR** — `git push -u origin <branch>` then `gh pr create`
   - **D) Keep working** — Stay on branch, list remaining issues

   If tests fail or build broken:
   - Show failures and suggest fixes
   - Only offer option D
```

---

## STEP 6: Create Rules

### File: `.claude/rules/error-protocol.md`

```markdown
# 3-Strike Error Protocol

When a tool call, test, or build fails:

## Strike 1: Diagnose & Fix

- Read the error message carefully
- Identify root cause (not just symptoms)
- Apply a targeted fix
- Re-run to verify

## Strike 2: Alternative Approach

- The first fix didn't work — do NOT retry the same thing
- Step back and consider a different approach
- Check if the problem is upstream (wrong file, wrong assumption, missing dependency)
- Apply the alternative and verify

## Strike 3: STOP

- Two attempts failed — continuing will waste tokens and context
- Log the issue to `.planning/progress.md` with:
  - What was attempted
  - What error occurred each time
  - What you think the root cause might be
- Ask the user for guidance before proceeding

## Hard Rules

- NEVER retry the exact same approach twice
- NEVER ignore test failures and move on
- NEVER suppress errors to make tests pass (unless the error itself is the bug being fixed)
- If you catch yourself in a retry loop, invoke Strike 3 immediately
```

### File: `.claude/rules/workflow.md`

```markdown
# Workflow Rules

## Multi-File Changes (3+ files)

1. Use the design-first skill — mandatory
2. Read ALL target files first (read-only pass)
3. Write design to `.planning/task_plan.md`
4. Present design to user, wait for approval
5. **No code changes until user approves**
6. Execute one file at a time, verify after each

## Single-File Changes

1. Read the file
2. Make the change
3. Run relevant tests
4. Done

## Bug Fixes

1. Write a failing test that reproduces the bug
2. Fix the bug (minimum change needed)
3. Verify the test passes
4. Check no other tests broke

## Refactors

1. Ensure full test coverage exists first
2. Run tests before starting (baseline)
3. Make changes incrementally
4. Run tests after each increment
5. If tests break, revert the last increment and try differently
```

### File: `.claude/rules/coding-style.md`

```markdown
# Coding Style

## File Limits

- Max 500 lines per file (split if exceeding)
- Max 80 lines per function (extract helpers if exceeding)
- Max 3 levels of nesting (refactor with early returns)

## Naming

- **Variables/functions**: camelCase
- **React components**: PascalCase
- **Database columns**: snake_case
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case for utilities, PascalCase for React components

## Imports

- ES modules only (`import/export`, never `require`) unless the project uses CommonJS
- Group: node builtins, external packages, internal modules, relative imports

## Error Handling

- Always catch async errors (no unhandled promise rejections)
- Catch blocks must provide context, not just re-throw
- Never swallow errors silently (`catch (e) {}` is forbidden)
- Never expose stack traces in error responses

## Comments

- Only where logic is non-obvious
- No commented-out code (delete it, git has history)
- TODO format: `// TODO(username): description`
```

### File: `.claude/rules/testing.md`

```markdown
# Testing Rules

## When Tests Are Required

- Every new function or endpoint gets at least one test
- Every bug fix gets a regression test BEFORE the fix (TDD)
- Every route handling user data gets auth tests (401/403)

## Test Quality

- Test behavior, not implementation (assert outputs, not internal calls)
- One assertion concept per test (multiple expects are fine if testing one behavior)
- Test names describe the scenario: `should return 401 when token is missing`
- No `test.skip` without a TODO comment explaining why

## Known Limitations

- Document any known test infrastructure limitations in this file
- Expected failures should be noted so they're not confused with regressions
```

### File: `.claude/rules/git-workflow.md`

```markdown
# Git Workflow

## Branching

- Feature branches only: `feature/description`, `fix/description`, `refactor/description`
- Never commit directly to main (PreToolUse hook blocks this if configured)
- One logical change per commit

## Commits

- Use `-m` flag (HEREDOC can hang on Windows/MSYS)
- Imperative mood: "Add patient export" not "Added patient export"
- Stage files by name: `git add src/file.js src/other.js`
- NEVER use `git add .` or `git add -A` (risk of staging secrets, can timeout on large repos)

## Before Committing

- Run relevant tests
- Verify build succeeds (if applicable)
- Check for debug statements

## Commit Message Format

<type>: <short description>

Types: feat, fix, refactor, test, docs, chore, perf
```

---

## STEP 7: Create Design-First Skill

### File: `.claude/skills/design-first/SKILL.md`

```markdown
---
name: design-first
description: Mandatory design gate for changes touching 3+ files. Enforces read-first, plan-first, approve-first workflow to prevent wrong-approach rework.
---

# Design-First Gate

This skill activates automatically when a task will modify 3 or more files.

## Phase 1: Research (Read-Only)

Read ALL files that will be modified. Do not edit anything yet.

For each file, note:

- Current structure and patterns
- How it connects to other files being changed
- Any tests that cover this file

Write findings to `.planning/findings.md`.

## Phase 2: Design

Write the implementation plan to `.planning/task_plan.md`:

- Goal (1 sentence)
- Files to modify (with specific changes per file)
- Order of changes (dependencies first)
- Verification steps (which tests to run, what to check)
- Rollback plan (how to undo if it goes wrong)

## Phase 3: Approval Gate

Present the design to the user:

DESIGN REVIEW
Goal: [goal]
Files: [count] files to modify
Changes:

1. [file] — [what changes]
2. [file] — [what changes]
   Tests: [which tests verify this]
   Risk: [low/medium/high]

Proceed? (y/n)

**HARD GATE: Do NOT write any code until the user approves.**

## Phase 4: Execute

After approval:

1. Execute changes one file at a time
2. Run tests after each file change
3. If tests fail, stop and diagnose (do not continue to next file)
4. Update `.planning/progress.md` after each step

## Phase 5: Verify

After all changes:

1. Run full test suite for affected area
2. Verify build succeeds
3. Compare result against the approved design
4. Report any deviations
```

---

## STEP 8: Upgrade Code-Reviewer Agent

If you have a `.claude/agents/code-reviewer.md`, replace its content with this two-stage review pattern. If you don't have one, create it:

### File: `.claude/agents/code-reviewer.md`

```markdown
---
name: code-reviewer
description: Reviews code for spec compliance and quality. Two-stage review: spec compliance first (blocking), then code quality.
tools: Read, Grep, Glob
model: claude-opus-4-6
---

You are a senior code reviewer. Reviews are two-stage: spec compliance first, then code quality.

## Stage 1: Spec Compliance (BLOCKING)

This stage MUST pass before proceeding to Stage 2. Check:

1. **Does the change match the task?** Compare against `.planning/task_plan.md` if it exists
2. **Is anything missing?** Required functionality not implemented
3. **Scope creep?** Changes outside the task scope that weren't requested
4. **Test coverage?** New functionality has tests, bug fixes have regression tests

### Stage 1 Output

STAGE 1: SPEC COMPLIANCE

- Task match: PASS/FAIL — [details]
- Completeness: PASS/FAIL — [missing items]
- Scope: PASS/FAIL — [out-of-scope changes]
- Tests: PASS/FAIL — [missing test cases]

If ANY Stage 1 check fails: STOP. Report failures. Do NOT proceed to Stage 2.

## Stage 2: Code Quality (only if Stage 1 passes)

Review priorities (in order):

1. **Error handling**: Are errors caught? Are async operations properly awaited?
2. **Performance**: Missing keys in lists, unnecessary re-renders, N+1 queries
3. **Security**: Input validation, auth checks, data exposure
4. **Test quality**: Edge cases covered? Tests assert behavior, not implementation?

## DO NOT flag

- Style/formatting (Prettier or linters handle this)
- Import ordering
- "You could also..." suggestions that add complexity
- Anything that would take <15 minutes to fix unless it's a security issue

## OUTPUT

Stage 1 results first, then Stage 2 if applicable. Numbered list, severity tag, file:line, issue, fix. Maximum 10 items total.
```

---

## STEP 9: Create Session Catchup Script

### File: `scripts/session-catchup.sh`

```bash
#!/usr/bin/env bash
# Session catchup script — prints current state for context recovery
# Used by /reboot and /resume commands

echo "=== SESSION CATCHUP ==="
echo ""

# Git state
echo "--- GIT STATE ---"
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "Branch: $BRANCH"
git log --oneline -5 2>/dev/null || echo "No git history"
echo ""
CHANGES=$(git status --porcelain 2>/dev/null | wc -l)
echo "Uncommitted changes: $CHANGES"
if [ "$CHANGES" -gt 0 ]; then
  git status --short 2>/dev/null
fi
echo ""

# Active plan
echo "--- ACTIVE PLAN ---"
if [ -f .planning/task_plan.md ]; then
  head -30 .planning/task_plan.md
else
  echo "No active plan (.planning/task_plan.md not found)"
fi
echo ""

# Recent progress
echo "--- RECENT PROGRESS ---"
if [ -f .planning/progress.md ]; then
  tail -20 .planning/progress.md
else
  echo "No progress log (.planning/progress.md not found)"
fi
echo ""

# Test health (quick check — don't run full suites)
echo "--- TEST HEALTH ---"
if [ -f backend/package.json ]; then
  BACKEND_TESTS=$(grep -c '"test"' backend/package.json 2>/dev/null)
  echo "Backend test script: $([ "$BACKEND_TESTS" -gt 0 ] && echo 'configured' || echo 'missing')"
fi
if [ -f frontend/package.json ]; then
  FRONTEND_TESTS=$(grep -c '"test"' frontend/package.json 2>/dev/null)
  echo "Frontend test script: $([ "$FRONTEND_TESTS" -gt 0 ] && echo 'configured' || echo 'missing')"
fi
if [ -f package.json ]; then
  ROOT_TESTS=$(grep -c '"test"' package.json 2>/dev/null)
  echo "Root test script: $([ "$ROOT_TESTS" -gt 0 ] && echo 'configured' || echo 'missing')"
fi
echo ""

# Tool call counter
echo "--- SESSION METRICS ---"
if [ -f /tmp/claude_tc ]; then
  echo "Tool calls this session: $(cat /tmp/claude_tc)"
else
  echo "Tool call counter: not started"
fi
echo ""
echo "=== END CATCHUP ==="
```

Make it executable: `chmod +x scripts/session-catchup.sh`

---

## STEP 10: Create Skills Index (Optional)

### File: `.claude/skills/INDEX.md`

List all skills in the project so Claude can reference them:

```markdown
# Skills Index

| Skill          | Trigger                      | Purpose                                                |
| -------------- | ---------------------------- | ------------------------------------------------------ |
| `design-first` | Any change touching 3+ files | Mandatory design gate: read → plan → approve → execute |
```

Add rows for any other skills already in the project.

---

## Verification Checklist

After implementing everything, verify:

1. `cat .claude/settings.json | node -e "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('valid JSON')"` — settings parseable
2. `.planning/` directory exists with 3 template files
3. `ls .claude/commands/` shows: save-state, resume, reboot, dev-task, parallel, finish-branch (plus any pre-existing)
4. `ls .claude/rules/` shows: error-protocol, workflow, coding-style, testing, git-workflow (plus any pre-existing)
5. `ls .claude/skills/design-first/SKILL.md` exists
6. `grep 'model:' .claude/agents/*.md` shows sonnet for workers, opus for reviewers
7. `grep '.planning/' .gitignore` shows the entry
8. `bash scripts/session-catchup.sh` runs without errors

Commit all changes on the feature branch, then merge to main.

---

## Expected Impact

| Metric                | Improvement                                                   |
| --------------------- | ------------------------------------------------------------- |
| Allow-list tokens     | ~210 saved per session                                        |
| Subagent cost         | ~60% reduction (Sonnet for workers)                           |
| Post-compact recovery | ~90% context retained via disk files                          |
| Error retry waste     | 3-strike cap (~30% fewer wasted tokens)                       |
| Multi-file rework     | Design gate prevents wrong-approach starts (~50% less rework) |

---

## Sources

Patterns synthesized from:

- `everything-claude-code` — Token optimization, model routing, hooks, security
- `awesome-claude-code-subagents` — 127+ agent catalog, tool assignment, model tiering
- `planning-with-files` — 3-file disk memory, PreToolUse plan injection, session recovery
- `superpowers` — Mandatory skill gates, design-before-code, two-stage review, subagent isolation
