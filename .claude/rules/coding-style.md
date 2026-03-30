# Coding Style

## File Limits
- Max 500 lines per file (split if exceeding)
- Max 80 lines per function (extract helpers if exceeding)
- Max 3 levels of nesting (refactor with early returns)

## Naming
- **Variables/functions**: camelCase (`getPatientById`, `isAuthenticated`)
- **React components**: PascalCase (`PatientDetail`, `SOAPNote`)
- **Database columns**: snake_case (`created_at`, `patient_id`, `organization_id`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `DEFAULT_LOCALE`)
- **Files**: kebab-case for utilities (`data-paths.js`), PascalCase for React components (`PatientDetail.jsx`)

## Imports
- ES modules only (`import/export`, never `require`)
- Group: node builtins, external packages, internal modules, relative imports
- Prettier handles formatting — do not manually sort

## Error Handling
- Always catch async errors (no unhandled promise rejections)
- Catch blocks must provide context, not just re-throw
- Never swallow errors silently (`catch (e) {}` is forbidden)
- Never expose stack traces or PHI in error responses

## Comments
- Only where logic is non-obvious
- No commented-out code (delete it, git has history)
- TODO format: `// TODO(username): description`
