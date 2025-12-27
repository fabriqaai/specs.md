---
id: vscode-extension-story-sp-009
unit: sidebar-provider
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-26
assigned_bolt: null
implemented: false
---

# Story: Up Next Queue with Dependencies

## User Story

**As a** user
**I want** to see pending bolts ordered by what I can work on next
**So that** I know which bolt to pick up when I finish my current work

## Acceptance Criteria

- [ ] **Given** pending bolts exist, **When** I view Up Next, **Then** I see a count badge "X bolts"
- [ ] **Given** pending bolts, **When** I view the queue, **Then** unblocked bolts appear first
- [ ] **Given** multiple unblocked bolts, **When** I view the queue, **Then** they're ordered by unblocksCount (highest first)
- [ ] **Given** a blocked bolt, **When** I view it in queue, **Then** it shows 🔒 icon
- [ ] **Given** a blocked bolt, **When** I view it, **Then** I see "Waiting: bolt-x, bolt-y" text
- [ ] **Given** an unblocked bolt, **When** I view it, **Then** I see priority number (1, 2, 3...)
- [ ] **Given** a queue item, **When** I view it, **Then** I see bolt name and stage indicators
- [ ] **Given** I click a queue item, **When** clicked, **Then** it shows toast "Starting bolt..."

## Technical Notes

- Queue ordering logic from artifact-parser `getUpNextBolts()`
- Blocked bolts show: lock icon, "Waiting: {blockedBy.join(', ')}"
- Unblocked bolts show: priority number, "Enables: X bolts" if unblocksCount > 0
- Stage indicators: small squares showing DDD stages or Simple stages
- Max display: 5 items, with "Show more" if needed

## Dependencies

### Requires
- 007-command-center-bolts-tab
- artifact-parser/005-bolt-dependencies (isBlocked, blockedBy, unblocksCount)

### Enables
- User can see prioritized work queue

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No pending bolts | Show "Queue empty" message |
| All pending bolts blocked | Show all with lock icons |
| Bolt blocks itself (circular) | Show as blocked |
| Many pending bolts | Show first 5, "Show more" link |

## Out of Scope

- Starting bolts from queue
- Reordering queue manually
- Filtering queue
