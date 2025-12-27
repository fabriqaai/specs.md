# Implementation Plan: Bolt 3 - Bolts View Lit Components

## Overview

This bolt migrates the Bolts view from server-rendered HTML to a complete set of Lit components with proper data bindings. This is the largest migration effort, creating 9 component files.

## Current State Analysis

### Hybrid Approach (Bolt 2)
- Server generates HTML via `getBoltsViewHtml()`
- Provider sends HTML strings via postMessage
- App uses `unsafeHTML()` to render

### Target State (This Bolt)
- Server sends structured data via postMessage
- Lit components render from data properties
- Cleaner separation of concerns

## Architecture Decision

**Full Lit Components** - We will create complete Lit components that receive data objects rather than HTML strings. This provides:
- Better type safety
- Easier testing
- More maintainable code
- Proper encapsulation

## Components to Create

### Component Hierarchy
```
bolts-view
├── mission-status
├── focus-section
│   └── focus-card
│       ├── progress-ring (shared)
│       ├── stage-pipeline (shared)
│       └── stories-list
├── queue-section
│   └── queue-item
└── activity-feed
    └── activity-item
```

### File Structure
```
src/webview/components/
├── bolts/
│   ├── bolts-view.ts        # Container component
│   ├── mission-status.ts    # Intent stats header
│   ├── focus-section.ts     # Current Focus wrapper
│   ├── focus-card.ts        # Expandable active bolt card
│   ├── stories-list.ts      # Story checkboxes
│   ├── queue-section.ts     # Up Next wrapper
│   ├── queue-item.ts        # Queue bolt item
│   ├── activity-feed.ts     # Activity with filters
│   └── activity-item.ts     # Single activity event
└── shared/
    ├── base-element.ts      # (exists)
    ├── progress-ring.ts     # SVG progress ring
    └── stage-pipeline.ts    # Stage status indicators
```

## Implementation Steps

### Step 1: Create Shared Components
1. **progress-ring.ts** - SVG progress ring with percentage
   - Props: `percent: number`
   - SVG with stroke-dashoffset calculation

2. **stage-pipeline.ts** - Stage status indicator row
   - Props: `stages: StageData[]`
   - Shows abbreviations and connectors

### Step 2: Create Activity Components
3. **activity-item.ts** - Single activity event
   - Props: `event: ActivityEventData`
   - Dispatches `open-file` event on click

4. **activity-feed.ts** - Activity list with filters
   - Props: `events: ActivityEventData[]`, `filter: ActivityFilter`, `height: number`
   - Dispatches `filter-change`, `resize` events

### Step 3: Create Queue Components
5. **queue-item.ts** - Queued bolt item
   - Props: `bolt: QueuedBoltData`, `priority: number`
   - Shows blocked state, dispatches `start-bolt` event

6. **queue-section.ts** - Up Next section
   - Props: `bolts: QueuedBoltData[]`
   - Contains queue-item list

### Step 4: Create Focus Components
7. **stories-list.ts** - Story checkboxes
   - Props: `stories: StoryData[]`
   - Shows completion status

8. **focus-card.ts** - Expandable bolt card
   - Props: `bolt: ActiveBoltData`, `expanded: boolean`
   - Contains progress-ring, stage-pipeline, stories-list
   - Dispatches `toggle-expand` event

9. **focus-section.ts** - Current Focus wrapper
   - Props: `bolt: ActiveBoltData | null`, `expanded: boolean`
   - Shows empty state when no active bolt

### Step 5: Create Container Components
10. **mission-status.ts** - Intent with stats
    - Props: `intent: IntentInfo | null`, `stats: BoltStats`
    - Shows current intent and statistics

11. **bolts-view.ts** - Main container
    - Props: `data: BoltsViewData`
    - Composes all sections

### Step 6: Integration
12. **Update app.ts** - Use bolts-view component
    - Import and render `<bolts-view>`
    - Pass structured data instead of HTML

13. **Update webviewProvider.ts** - Send structured data
    - Create `_sendBoltsData()` method
    - Include all bolts view data fields

## Data Types

Create new types in `src/webview/types/bolts.ts`:
```typescript
export interface BoltsViewData {
    currentIntent: IntentInfo | null;
    stats: BoltStats;
    activeBolt: ActiveBoltData | null;
    upNextQueue: QueuedBoltData[];
    activityEvents: ActivityEventData[];
    focusCardExpanded: boolean;
    activityFilter: ActivityFilter;
    activityHeight: number;
}
```

## Event Flow

```
User Action → Lit Component Event → App Handler → postMessage → Provider → State Update
```

Events to implement:
- `toggle-focus` - Focus card expand/collapse
- `filter-change` - Activity filter change
- `resize-activity` - Activity section resize
- `start-bolt` - Start queued bolt
- `open-file` - Open activity file

## Styles Approach

Each component has its own scoped styles using:
- VS Code CSS variables from theme.ts
- Component-specific layout styles
- Status colors from theme (--status-complete, etc.)

## Testing Strategy

- Manual verification of each component
- Verify event propagation works correctly
- Check VS Code theme integration
- Verify expand/collapse animations

## Estimated Effort

| Component | Complexity | Lines (est) |
|-----------|------------|-------------|
| progress-ring | Low | 50 |
| stage-pipeline | Low | 70 |
| activity-item | Low | 60 |
| activity-feed | Medium | 120 |
| queue-item | Medium | 100 |
| queue-section | Low | 60 |
| stories-list | Low | 50 |
| focus-card | High | 150 |
| focus-section | Low | 60 |
| mission-status | Low | 80 |
| bolts-view | Medium | 100 |
| **Total** | | ~900 |

## Success Criteria

From bolt.md:
- [ ] `<bolts-view>` container component renders all sections
- [ ] `<mission-status>` shows current intent with statistics
- [ ] `<focus-card>` expands/collapses with animation
- [ ] `<progress-ring>` SVG renders progress correctly
- [ ] `<stage-pipeline>` shows stage status indicators
- [ ] `<queue-section>` lists pending bolts with priority
- [ ] `<queue-item>` shows Start button with command popup
- [ ] `<activity-feed>` displays events with filtering
- [ ] `<activity-item>` clickable to open files
- [ ] All components use VS Code theme colors
