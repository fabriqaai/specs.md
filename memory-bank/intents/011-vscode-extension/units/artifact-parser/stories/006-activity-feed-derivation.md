---
id: vscode-extension-story-ap-006
unit: artifact-parser
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-26
assigned_bolt: null
implemented: false
---

# Story: Activity Feed Derivation

## User Story

**As a** extension developer
**I want** activity events derived from bolt timestamps
**So that** the UI can display a recent activity feed without maintaining a separate log

## Acceptance Criteria

- [ ] **Given** a bolt with `created: 2025-12-26T09:00:00Z`, **When** buildActivityFeed called, **Then** result includes `bolt-created` event with that timestamp
- [ ] **Given** a bolt with `started: 2025-12-26T10:00:00Z`, **When** buildActivityFeed called, **Then** result includes `bolt-start` event
- [ ] **Given** a bolt with `stages_completed: [{name: model, completed: ...}]`, **When** buildActivityFeed called, **Then** result includes `stage-complete` event for each entry
- [ ] **Given** a bolt with `completed: 2025-12-26T12:00:00Z`, **When** buildActivityFeed called, **Then** result includes `bolt-complete` event
- [ ] **Given** multiple bolts with various timestamps, **When** buildActivityFeed called, **Then** result is sorted by timestamp descending
- [ ] **Given** an activity event, **When** accessed, **Then** it has: id, type, timestamp, icon, iconClass, text, targetId, targetName, tag

## Technical Notes

- ActivityEvent interface:
  ```typescript
  interface ActivityEvent {
    id: string;           // e.g., "bolt-x-started"
    type: 'bolt-created' | 'bolt-start' | 'stage-complete' | 'bolt-complete';
    timestamp: Date;
    icon: string;         // e.g., "▶", "✓", "✔", "+"
    iconClass: string;    // e.g., "bolt-start", "stage-complete"
    text: string;         // e.g., "Started <strong>bolt-x</strong>"
    targetId: string;     // Bolt ID
    targetName: string;   // Bolt name
    tag: 'bolt' | 'stage';
  }
  ```
- Parse ISO 8601 timestamps from frontmatter
- Handle missing/null timestamps gracefully (skip event)

## Dependencies

### Requires
- 003-artifact-parsing (bolt parsing)
- 004-frontmatter-parser

### Enables
- sidebar-provider/010-activity-feed-ui

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Bolt with null timestamps | Skip those events |
| Invalid timestamp format | Skip that event, log warning |
| Empty bolts array | Return empty activity feed |
| Bolt with only created timestamp | Only bolt-created event |

## Out of Scope

- Persisting activity to separate file
- Activity for non-bolt events (stories, intents)
- Activity pruning/limiting at parser level
