---
name: subagent-review
description: Structured review gates for parallel agent workflows. Activates when spawning 3+ parallel agents to prevent cross-contamination.
allowed-tools: Read, Grep, Glob, Bash(git diff *), Bash(git status *)
---

# Subagent Review Gates

Activates when dispatching 3+ parallel agents to ensure results don't conflict.

## Pre-Dispatch Checklist

Before spawning agents:

1. Define clear file boundaries — no two agents should modify the same file
2. List expected outputs per agent
3. Set review checkpoints (after each agent completes)

## Post-Agent Review Protocol

When agent results arrive:

### Gate 1: Conflict Detection

```bash
git diff --stat
```

- Check if multiple agents modified the same file
- If conflict detected: review both changes, keep the better one, revert the other

### Gate 2: Cross-Reference Verification

- Do agent A's changes break agent B's changes?
- Run tests after merging each agent's results
- If tests fail after merging: isolate which agent's changes caused the failure

### Gate 3: Consistency Check

- Are naming conventions consistent across agent outputs?
- Are import paths correct (agents may use different relative paths)?
- Are there duplicate function definitions?

## Recovery Protocol

If an agent produced bad results:

1. `git stash` the merged result
2. Cherry-pick only the good agent's changes
3. Re-run the failed agent's task with clearer instructions
4. Never merge blindly — always review diffs

## Integration with /parallel Command

When `/parallel` is used to spawn agents, this skill auto-activates for the review phase.
