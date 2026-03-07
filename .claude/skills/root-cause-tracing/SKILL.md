---
name: root-cause-tracing
description: Deep execution path tracing when errors persist after first fix attempt. Auto-activates on Strike 2 of the 3-strike error protocol.
allowed-tools: Read, Grep, Glob, Bash(node *), Bash(cd backend && npm test *), Bash(cd frontend && npx vitest *)
---

# Root Cause Tracing

Activates automatically when the same error persists after the first fix attempt (Strike 2 of the 3-strike error protocol).

## Step 1: Capture the Error Chain

- Read the full error message and stack trace
- Identify the EXACT file and line where the error originates
- Read that file and understand the function context

## Step 2: Trace the Call Stack

Starting from the error location, trace BACKWARDS:

1. What function called this? Read the caller
2. What data was passed in? Check argument types and values
3. Where did that data come from? Trace one level further back
4. Continue until you find the entry point (route handler, event listener, component mount)

Document the chain:
```
Entry: routes/patients.js:45 (GET /api/v1/patients/:id)
  -> services/patientService.js:112 (getById)
    -> models/patient.js:67 (findOne)
      -> ERROR: column "fodselsnummer" does not exist
Root cause: Migration 045 renamed column but service still uses old name
```

## Step 3: Map the Data Flow

- What is the expected type/shape of data at each step?
- Where does the actual data diverge from the expectation?
- Is the issue in the data, the transform, or the consumer?

## Step 4: Check the Periphery

Before fixing, verify:
- Are there OTHER callers of the same function that might break?
- Are there tests that should have caught this? Why didn't they?
- Is there a migration or schema change that caused the mismatch?

## Step 5: Fix and Verify

- Apply the fix at the ROOT, not at the symptom
- Run the originally failing test
- Run related tests (same module/route)
- If the fix touches a migration or schema, check all queries using that table

## Integration with 3-Strike Protocol

- Strike 1: Normal fix attempt (may not trace deeply)
- Strike 2: THIS SKILL activates — full trace required before attempting fix
- Strike 3: If root-cause tracing didn't solve it, document findings and ask user
