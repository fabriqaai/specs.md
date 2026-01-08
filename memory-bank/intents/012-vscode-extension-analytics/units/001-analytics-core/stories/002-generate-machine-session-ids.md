---
story: 002-generate-machine-session-ids
unit: 001-analytics-core
intent: 012-vscode-extension-analytics
priority: must
status: complete
implemented: true
created: 2025-01-08T12:30:00Z
---

# Story: Generate Machine and Session IDs

## User Story

**As a** specsmd maintainer
**I want** consistent machine IDs and unique session IDs
**So that** I can track unique users and sessions without PII

## Acceptance Criteria

- [ ] Machine ID is SHA-256 hash of machine-specific data
- [ ] Machine ID is consistent across extension activations
- [ ] Machine ID stored in globalState for persistence
- [ ] Session ID is UUID v4 generated per activation
- [ ] Session ID is unique for each extension activation
- [ ] No personally identifiable information used in ID generation
- [ ] IDs included as distinct_id and session_id in base properties

## Technical Notes

Machine ID generation should match npx tracker pattern:
- Use crypto.createHash('sha256')
- Hash combination of hostname + salt
- Store in globalState to ensure consistency

```typescript
// Machine ID: persistent across sessions
const machineId = getMachineId(context.globalState);

// Session ID: unique per activation
const sessionId = crypto.randomUUID();
```

## Estimate

**Size**: S
