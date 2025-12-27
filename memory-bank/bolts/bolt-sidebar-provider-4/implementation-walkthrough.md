# Implementation Walkthrough: bolt-sidebar-provider-4

## Overview

This bolt enhances the webview UI with:
1. Expandable Current Focus card with progress ring and stage pipeline
2. Enhanced Up Next queue with lock icons and stage indicators
3. Activity feed with filters and resizable height

## Implementation Details

### Story 008: Current Focus Card

**Files Modified:**
- `src/sidebar/webviewContent.ts` - Added expandable card HTML, progress ring SVG, stage pipeline, stories checklist
- `src/sidebar/webviewMessaging.ts` - Added `focusCardExpanded` to WebviewData
- `src/sidebar/webviewProvider.ts` - Added state restoration and message handling

**Key Components:**

1. **Expandable Card Header**
   - Click header to toggle expand/collapse
   - State persisted via `specsmd.focusCardExpanded` workspace key
   - CSS transition for smooth expand/collapse animation

2. **Progress Ring (SVG)**
   - 48x48 SVG with stroke-dasharray calculation
   - Progress = (stagesComplete + storiesComplete) / (stagesTotal + storiesTotal)
   - Animated fill using CSS transition

3. **Stage Pipeline**
   - Horizontal indicators (DDD: M-D-A-I-T, Simple: P-I-T)
   - Color-coded: green=complete, orange=active (pulsing), gray=pending
   - Single-letter abbreviations with full name below

4. **Stories Checklist**
   - List with checkbox icons
   - Checkmark for complete, empty for pending
   - Strikethrough text for completed stories

5. **Action Buttons**
   - "Continue" button sends `startBolt` message
   - "Files" button (placeholder for future)

### Story 009: Up Next Queue

**Files Modified:**
- `src/sidebar/webviewContent.ts` - Updated queue item HTML

**Key Components:**

1. **Lock Icon for Blocked Bolts**
   - Shows lock icon (🔒) instead of priority number
   - Red color to indicate blocked state

2. **Waiting Text**
   - Changed "Blocked by:" to "Waiting:" format
   - Lists dependent bolt IDs

3. **Stage Indicators**
   - Mini squares (8x8px) showing stage status
   - Color-coded: green=complete, orange=active, gray=pending

### Story 010: Activity Feed UI

**Files Modified:**
- `src/sidebar/webviewContent.ts` - Added filters and resize handle
- `src/sidebar/webviewMessaging.ts` - Added `ActivityFilter` type, constants
- `src/sidebar/webviewProvider.ts` - Added filter/height state and handlers

**Key Components:**

1. **Filter Buttons**
   - Toggle: All | Stages | Bolts
   - Client-side filtering via `data-tag` attribute
   - State persisted via `specsmd.activityFilter` key

2. **Resize Handle**
   - Drag handle above activity section
   - Mouse drag to resize (120-500px range)
   - Height persisted via `specsmd.activityHeight` key

3. **Height Persistence**
   - Initial height from saved state (default 200px)
   - Inline style applied: `style="height: ${data.activityHeight}px;"`

## State Keys Added

| Key | Type | Default |
|-----|------|---------|
| `specsmd.focusCardExpanded` | boolean | false |
| `specsmd.activityFilter` | 'all' \| 'stages' \| 'bolts' | 'all' |
| `specsmd.activityHeight` | number | 200 |

## Message Types Added

| Message | Direction | Purpose |
|---------|-----------|---------|
| `toggleFocus` | webview → extension | Persist focus card state |
| `activityFilter` | webview → extension | Persist filter selection |
| `activityResize` | webview → extension | Persist section height |

## CSS Classes Added

### Focus Card
- `.focus-card-expand` - Chevron indicator
- `.focus-card-body` - Collapsible body container
- `.focus-progress` - Progress ring container
- `.progress-ring`, `.progress-ring-bg`, `.progress-ring-fill` - SVG ring
- `.stage-pipeline`, `.stage-pip`, `.stage-pip-indicator` - Stage pipeline
- `.focus-stories`, `.focus-story-item`, `.focus-story-checkbox` - Stories list
- `.focus-actions`, `.focus-btn` - Action buttons

### Queue
- `.queue-lock` - Lock icon for blocked bolts
- `.queue-stages`, `.queue-stage` - Stage indicator squares

### Activity
- `.activity-filters`, `.activity-filter-btn` - Filter toggle buttons
- `.activity-resize-handle` - Drag handle for resize

## JavaScript Added

1. **Focus Card Toggle**
   - Click listener on `.focus-card-header`
   - Toggles `.expanded` class
   - Posts `toggleFocus` message

2. **Activity Filter**
   - Click listener on `.activity-filter-btn`
   - Updates active state, filters items by `data-tag`
   - Posts `activityFilter` message

3. **Activity Resize**
   - mousedown/mousemove/mouseup handlers
   - Calculates delta, clamps to 120-500px
   - Posts `activityResize` message

## Testing

- All existing tests pass (197 tests)
- Updated test files to include new WebviewData properties
- TypeScript compilation successful
- ESLint passes

## Verification Checklist

- [x] Focus card expands/collapses on click
- [x] Progress ring shows correct percentage
- [x] Stage pipeline shows DDD or Simple stages
- [x] Stories checklist shows completion status
- [x] Continue button sends startBolt message
- [x] Queue shows lock icon for blocked bolts
- [x] Queue shows "Waiting: ..." for blocked
- [x] Queue shows stage indicators
- [x] Activity filter buttons work
- [x] Activity section resizes with drag
- [x] Activity height persists across sessions
- [x] All state persists in workspaceState
