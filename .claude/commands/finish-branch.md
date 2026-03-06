Pre-merge checklist for the current feature branch.

## Steps

1. **Run all tests:**
   ```bash
   cd backend && npm test
   cd frontend && npx vitest --run
   ```

2. **Check for debug artifacts:**
   - `grep -rn 'console\.log' backend/src/ frontend/src/ --include='*.js' --include='*.jsx'`
   - `grep -rn 'TODO\|FIXME\|HACK\|XXX' backend/src/ frontend/src/ --include='*.js' --include='*.jsx'`

3. **Verify build:**
   ```bash
   cd frontend && npm run build
   ```

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
