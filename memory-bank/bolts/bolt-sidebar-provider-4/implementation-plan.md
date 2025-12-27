# Implementation Plan: bolt-sidebar-provider-4

## Overview

This bolt enhances the webview UI components implemented in bolt-sidebar-provider-3 with:
1. Expandable focus card with progress ring and stage pipeline
2. Enhanced queue with lock icons and stage indicators
3. Activity feed with filters and resizable height

## Stories

| Story | Priority | Complexity |
|-------|----------|------------|
| 008-current-focus-card | Must | Medium |
| 009-up-next-queue | Must | Low |
| 010-activity-feed-ui | Must | Medium |

## Technical Approach

### 1. Current Focus Card (Story 008)

**Current State**: Basic card header showing bolt name, type, and "In Progress" badge.

**Enhancements**:
- **Expand/Collapse**: Click header to toggle body visibility
- **Progress Ring**: SVG circle with stroke-dasharray for percentage
- **Stage Pipeline**: Horizontal indicators (DDD: M-D-A-I-T, Simple: P-I-T)
- **Stories Checklist**: List with checkbox icons
- **Action Buttons**: "Continue" and "Files" buttons

**Implementation**:
1. Add CSS for `.focus-card-body`, `.progress-ring`, `.stage-pipeline`, `.story-checklist`
2. Add JavaScript for expand/collapse toggle
3. Persist expand state via PostMessage to workspaceState
4. Generate SVG progress ring with calculated dasharray

**Data Additions** (webviewMessaging.ts):
```typescript
// Add to WebviewData
focusCardExpanded: boolean;
```

### 2. Up Next Queue (Story 009)

**Current State**: Basic queue with priority numbers and blocked styling.

**Enhancements**:
- **Lock Icon**: Show 🔒 for blocked bolts instead of priority number
- **Waiting Text**: "Waiting: bolt-x, bolt-y" for blocked bolts
- **Enables Badge**: Show "Enables X" for bolts with unblocksCount > 0
- **Stage Indicators**: Small squares showing stage status

**Implementation**:
1. Update queue item HTML to show lock icon when blocked
2. Change "Blocked by" to "Waiting:" format
3. Add mini stage indicator squares
4. Add CSS for `.queue-lock`, `.queue-stage-indicators`

### 3. Activity Feed (Story 010)

**Current State**: Basic activity list with icons and timestamps.

**Enhancements**:
- **Filter Buttons**: All | Stages | Bolts toggle
- **Resize Handle**: Drag handle to resize section height
- **Height Persistence**: Save/restore height from workspaceState

**Implementation**:
1. Add filter buttons in activity header
2. Add resize handle div with CSS `cursor: ns-resize`
3. Add JavaScript for:
   - Filter toggle (client-side filtering)
   - Mouse drag for resize
   - PostMessage to persist height
4. Pass saved height from extension to webview

**Data Additions** (webviewMessaging.ts):
```typescript
// Add to WebviewData
activityFilter: 'all' | 'stages' | 'bolts';
activityHeight: number;
```

## File Changes

### webviewMessaging.ts
- Add `focusCardExpanded: boolean` to WebviewData
- Add `activityFilter: 'all' | 'stages' | 'bolts'` to WebviewData
- Add `activityHeight: number` to WebviewData
- Add `{ type: 'focusToggle'; expanded: boolean }` to WebviewToExtensionMessage
- Add `{ type: 'activityFilter'; filter: string }` to WebviewToExtensionMessage
- Add `{ type: 'activityResize'; height: number }` to WebviewToExtensionMessage

### webviewContent.ts
- Add CSS for progress ring, stage pipeline, expand/collapse
- Add CSS for resize handle, filter buttons
- Update `getBoltsTabHtml()` for expandable focus card
- Update queue item HTML for lock icons and stage indicators
- Update activity section for filters and resize
- Add JavaScript for:
  - Focus card expand/collapse
  - Activity filter toggle
  - Resize drag handling

### webviewProvider.ts
- Add state for focusCardExpanded, activityFilter, activityHeight
- Handle new message types
- Pass state to webview data

## CSS Additions

```css
/* Progress Ring */
.progress-ring { ... }
.progress-ring-circle { stroke-dasharray: calculated; }

/* Stage Pipeline */
.stage-pipeline { display: flex; gap: 4px; }
.stage-indicator { width: 20px; height: 20px; }
.stage-indicator.complete { background: green; }
.stage-indicator.active { background: orange; }
.stage-indicator.pending { background: gray; }

/* Focus Card Body */
.focus-card-body { max-height: 0; overflow: hidden; }
.focus-card.expanded .focus-card-body { max-height: 500px; }

/* Stories Checklist */
.story-checkbox { ... }

/* Action Buttons */
.focus-actions { display: flex; gap: 8px; }
.focus-btn { ... }

/* Queue Lock Icon */
.queue-lock { font-size: 14px; }

/* Queue Stage Indicators */
.queue-stages { display: flex; gap: 2px; }
.queue-stage { width: 8px; height: 8px; }

/* Activity Filters */
.activity-filters { display: flex; gap: 4px; }
.activity-filter-btn { ... }
.activity-filter-btn.active { ... }

/* Resize Handle */
.activity-resize-handle {
    height: 6px;
    cursor: ns-resize;
    background: var(--vscode-input-background);
}
```

## State Keys

| Key | Type | Default |
|-----|------|---------|
| `specsmd.focusCardExpanded` | boolean | false |
| `specsmd.activityFilter` | string | 'all' |
| `specsmd.activityHeight` | number | 200 |

## Verification Checklist

- [ ] Focus card expands/collapses on click
- [ ] Progress ring shows correct percentage
- [ ] Stage pipeline shows DDD or Simple stages
- [ ] Stories checklist shows completion status
- [ ] Continue button shows toast
- [ ] Queue shows lock icon for blocked bolts
- [ ] Queue shows "Waiting: ..." for blocked
- [ ] Queue shows stage indicators
- [ ] Activity filter buttons work
- [ ] Activity section resizes with drag
- [ ] Activity height persists across sessions
- [ ] All state persists in workspaceState
