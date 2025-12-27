---
id: vscode-extension-story-sp-014
unit: sidebar-provider
intent: 011-vscode-extension
status: complete
priority: could
created: 2025-12-26
assigned_bolt: bolt-sidebar-provider-5
implemented: true
---

# Story: Additional Intent Selection Strategies

## User Story

**As a** extension user
**I want** the current intent to be selected intelligently
**So that** the most relevant work is always shown

## Acceptance Criteria

- [ ] **Given** multiple intents exist, **When** one has an in-progress bolt, **Then** that intent is selected as current
- [ ] **Given** no in-progress bolts, **When** one intent has most recent activity, **Then** that intent is selected
- [ ] **Given** no recent activity, **When** one intent has most in-progress stories, **Then** that intent is selected
- [ ] **Given** completion percentage differs, **When** selecting current intent, **Then** intent with lowest completion (most work remaining) is preferred
- [ ] **Given** user clicks an intent, **When** intent is clicked, **Then** that intent becomes current (manual override)

## Technical Notes

Existing strategies (already implemented):
1. `selectIntentByActiveBolt` - Intent with in-progress bolt
2. `selectIntentByRecentActivity` - Intent with most recent bolt timestamp
3. `selectIntentByInProgressStories` - Intent with most in-progress stories

New strategies to add:
4. `selectIntentByCompletion` - Intent with lowest completion percentage
5. Manual selection via UI click (store in UIState.selectedIntentId)

Priority order:
1. Manual selection (if set)
2. Active bolt
3. Recent activity
4. In-progress stories
5. Lowest completion
6. First intent (fallback)

## Dependencies

### Requires
- state/selectors.ts (existing strategies)
- StateStore (UIState for manual selection)

### Enables
- More intelligent intent focus
