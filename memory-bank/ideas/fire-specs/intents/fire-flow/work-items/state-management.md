---
id: state-management
title: State Management System
complexity: medium
status: pending
tags: [core, foundation, phase-1]
---

# State Management System

## Description

Implement the central `state.yaml` system that tracks all project state for FIRE. This is the foundation that all agents read at session start to understand project context. Includes Node.js scripts for deterministic state operations.

## Acceptance Criteria

- [ ] Define `state.yaml` schema in `memory-bank.yaml`
- [ ] Create `state-read.ts` script - parses state.yaml, returns JSON
- [ ] Create `state-update-intent.ts` script - add/update intent status
- [ ] Create `state-update-work-item.ts` script - update work item status, link to runs
- [ ] Create `state-recalculate-summary.ts` script - recalculate all counts
- [ ] Create `state-set-active-run.ts` script - set/clear active run
- [ ] All scripts validate input and handle errors gracefully
- [ ] All scripts output JSON for AI consumption

## Technical Notes

### State Schema (state.yaml)

```yaml
project:
  name: string
  created: datetime
  framework: "fire-v1"

workspace:
  type: greenfield | brownfield
  structure: monolith | monorepo
  default_mode: autopilot | confirm | validate
  parts: []      # For monorepo
  key_files: []  # Important files inventory

intents:
  - id: string
    title: string
    status: pending | in_progress | done
    priority: low | medium | high | critical
    work_items:
      - id: string
        status: pending | in_progress | done | blocked
        complexity: low | medium | high
        depends_on: []
        started_in_run: number?
        completed_in_run: number?

summary:
  total_intents: number
  # ... counts

runs:
  last_completed: number?
  active: number?
```

### Script Interface Pattern

All scripts follow this pattern:

```typescript
// Input: CLI args
npx ts-node state-update-work-item.ts \
  --intent=auth-system \
  --work-item=login \
  --status=completed \
  --run-id=3

// Output: JSON to stdout
{
  "success": true,
  "previous_status": "in_progress",
  "new_status": "completed",
  "summary_updated": true
}

// Errors: JSON with error field
{
  "success": false,
  "error": "Work item 'login' not found in intent 'auth-system'"
}
```

### File Location

```
fire/skills/state-management/
├── SKILL.md
└── scripts/
    ├── state-read.ts
    ├── state-update-intent.ts
    ├── state-update-work-item.ts
    ├── state-recalculate-summary.ts
    └── state-set-active-run.ts
```

## Dependencies

None - this is the foundation.

## Estimated Complexity

Medium - well-defined schema, straightforward CRUD operations, but must handle edge cases correctly.
