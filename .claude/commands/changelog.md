---
description: Generates a grouped changelog from git history using conventional commit format.
---

Generate a changelog from git commit history.

$ARGUMENTS

## Usage

`/changelog` — changelog since last tag
`/changelog v1.0.0..HEAD` — changelog for specific range
`/changelog --all` — full changelog from first commit

## Steps

1. Determine the range:
   - Default: from last tag to HEAD (`git describe --tags --abbrev=0` to find last tag)
   - If $ARGUMENTS specifies a range, use that
   - If `--all`, use entire history

2. Parse commits:
```bash
git log {range} --pretty=format:"%h %s" --no-merges
```

3. Group by conventional commit type:
   - **Features** (`feat:`): New functionality
   - **Bug Fixes** (`fix:`): Bug fixes
   - **Performance** (`perf:`): Performance improvements
   - **Refactoring** (`refactor:`): Code restructuring
   - **Tests** (`test:`): Test additions/changes
   - **Documentation** (`docs:`): Documentation changes
   - **Chores** (`chore:`): Maintenance tasks

4. Output format:
```markdown
# Changelog

## [version] — {date}

### Features
- description (hash)

### Bug Fixes
- description (hash)

### Performance
- description (hash)

### Other Changes
- description (hash)
```

5. Write to `CHANGELOG.md` in project root (or print to stdout if `--stdout` flag)

## Notes

- Skip merge commits
- Strip the type prefix from commit messages for cleaner output
- Group Co-Authored-By lines at the bottom
- If no conventional commit prefix found, put under "Other Changes"
