# Permission Mode Rules

## Default: bypassPermissions

All agents MUST use `permissionMode: bypassPermissions` in their frontmatter.

The user runs sessions with `--dangerously-skip-permissions`. Agent-level permission modes
must not override this session-level choice.

## When to use plan mode

Plan mode is for the ORCHESTRATOR (the main Claude session), not for subagents.
Enter plan mode when:

- You encounter a genuine blocker or ambiguity that needs user input
- The user explicitly asks for planning
- A multi-file refactor needs design approval

NEVER silently downgrade from bypass to acceptEdits or plan.
