# Variation 8-2: Command Center Merged View Specification

## Overview

A VS Code sidebar extension view with three tabs (Bolts, Specs, Overview) that displays project state derived from parsed markdown frontmatter. The UI is a pure representation of a centralized metadata state object - it does not perform parsing or state management.

## Architecture Principle

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  File System    │────>│  Metadata Store  │────>│  UI Components  │
│  (*.md files)   │     │  (Single Source) │     │  (Read-only)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
   File Watcher            State Object              Renders State
   Parses YAML            Emits Changes             Subscribes to
   Frontmatter                                      State Updates
```

**Key Principles:**
1. UI components are pure renderers - they receive state and render it
2. All data transformations happen in the metadata store layer
3. File parsing is isolated - changing parser doesn't affect UI
4. UI can be swapped without touching data layer

---

## Metadata State Object

### Root State Structure

```typescript
interface SpecsMDState {
  // Current workspace context
  workspace: {
    name: string;
    path: string;
    memoryBankPath: string;
  };

  // Parsed artifacts indexed by ID
  intents: Map<string, Intent>;
  units: Map<string, Unit>;
  stories: Map<string, Story>;
  bolts: Map<string, Bolt>;
  standards: Map<string, Standard>;

  // Computed/derived state (cached, updated on change)
  computed: {
    currentIntent: Intent | null;
    activeBolt: Bolt | null;
    pendingBolts: Bolt[];
    completedBolts: Bolt[];
    activityFeed: ActivityEvent[];
    overallProgress: ProgressMetrics;
  };

  // UI state (separate from data state)
  ui: {
    activeTab: 'bolts' | 'specs' | 'overview';
    expandedIntents: Set<string>;
    expandedUnits: Set<string>;
    expandedBolts: Set<string>;
    activityFilter: 'all' | 'stage' | 'bolt';
    specsFilter: 'all' | 'active' | 'complete' | 'pending';
    activitySectionHeight: number;
  };
}
```

### Core Entity Types

```typescript
interface Intent {
  id: string;           // e.g., "011-vscode-extension"
  name: string;
  description?: string;
  filePath: string;

  // Relationships
  unitIds: string[];

  // Timestamps from frontmatter
  created?: Date;
  updated?: Date;

  // Computed
  status: 'pending' | 'active' | 'complete';
  progress: number;     // 0-100
}

interface Unit {
  id: string;           // e.g., "sidebar-provider"
  name: string;
  description?: string;
  filePath: string;

  // Relationships
  intentId: string;
  storyIds: string[];

  // Timestamps
  created?: Date;
  updated?: Date;

  // Computed
  status: 'pending' | 'active' | 'complete';
  progress: number;
}

interface Story {
  id: string;           // e.g., "001-tree-view"
  name: string;
  description?: string;
  filePath: string;

  // Relationships
  unitId: string;
  boltId?: string;      // Associated bolt if any

  // Status from frontmatter
  status: 'pending' | 'active' | 'complete';

  // Timestamps
  created?: Date;
  started?: Date;
  completed?: Date;
}

interface Bolt {
  id: string;           // e.g., "bolt-sidebar-ui-1"
  name: string;
  description?: string;
  filePath: string;

  // Type determines stage pipeline
  type: 'DDD' | 'Simple';

  // Relationships
  intentId: string;
  unitId?: string;
  storyIds: string[];

  // Dependencies (from frontmatter)
  requiresBolts: string[];   // Bolt IDs this bolt depends on
  enablesBolts: string[];    // Bolt IDs that depend on this bolt

  // Stage tracking
  stages: BoltStages;
  stagesCompleted: StageCompletion[];

  // Status
  status: 'pending' | 'active' | 'complete' | 'blocked';

  // Timestamps from frontmatter
  created?: Date;
  started?: Date;
  completed?: Date;

  // Computed
  progress: number;
  currentStage: string;
  isBlocked: boolean;        // true if any requiresBolts are not complete
  blockedBy: string[];       // IDs of incomplete required bolts
  unblocksCount: number;     // Number of bolts this enables (for prioritization)
}

interface BoltStages {
  // DDD Bolt stages
  model?: StageStatus;
  design?: StageStatus;
  adr?: StageStatus;
  implement?: StageStatus;
  test?: StageStatus;

  // Simple Bolt stages
  plan?: StageStatus;
}

type StageStatus = 'pending' | 'active' | 'complete' | 'skipped';

interface StageCompletion {
  name: string;
  completed: Date;
}

interface Standard {
  id: string;
  name: string;
  category: 'tech-stack' | 'coding-standards' | 'system-architecture';
  filePath: string;
  updated?: Date;
}
```

### Derived Types

```typescript
interface ActivityEvent {
  id: string;
  type: 'bolt-created' | 'bolt-start' | 'bolt-complete' | 'stage-complete';
  timestamp: Date;

  // Display
  icon: string;
  iconClass: string;
  text: string;          // e.g., "Completed <strong>model</strong> stage"

  // References
  targetId: string;      // Bolt ID
  targetName: string;    // Bolt name
  tag: 'bolt' | 'stage';
}

interface ProgressMetrics {
  totalIntents: number;
  totalUnits: number;
  totalStories: number;
  totalBolts: number;

  completedStories: number;
  completedBolts: number;

  overallPercent: number;
}
```

---

## UI Component Specification

### Tab Structure

```
┌─────────────────────────────────────────┐
│ SpecsMD                        [↻] [⚙]  │  Header
├─────────────────────────────────────────┤
│  ⚡ Bolts  │  📋 Specs  │  📊 Overview  │  Tabs
├─────────────────────────────────────────┤
│                                         │
│  [Tab Content Area]                     │  Content
│                                         │
├─────────────────────────────────────────┤
│  [ Dark ]  [ Light ]                    │  Theme Toggle
└─────────────────────────────────────────┘
```

### Bolts Tab Layout

```
┌─────────────────────────────────────────┐
│ CURRENT INTENT                          │
│ 011-vscode-extension                    │
│ ● 1 Active Bolts  ○ 1 Queued  ✓ 3 Done │
├─────────────────────────────────────────┤
│ 🎯 CURRENT FOCUS                        │
│ ┌─────────────────────────────────────┐ │
│ │ bolt-sidebar-ui-1        [In Progress]│ │  Expandable Card
│ │ DDD Bolt | Design Stage             │ │
│ ├─────────────────────────────────────┤ │
│ │  [Progress Ring]  Stage: Design     │ │  Expanded Content
│ │      40%          2 of 5 complete   │ │
│ │                                     │ │
│ │  [M]──[D]──[A]──[I]──[T]           │ │  Stage Pipeline
│ │   ✓    ●    ○    ○    ○            │ │
│ │                                     │ │
│ │  Stories (1/3)                      │ │
│ │  ☑ Create sidebar layout            │ │
│ │  ☐ Design tree view                 │ │
│ │  ☐ Implement expand/collapse        │ │
│ │                                     │ │
│ │  [Continue]  [Files]                │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ UP NEXT                        2 bolts  │
│ ┌─────────────────────────────────────┐ │
│ │ 1 │ bolt-webview-panel-1  [M][D]... │ │  Queue Items
│ │ 2 │ bolt-command-palette  [P][I][T] │ │
│ └─────────────────────────────────────┘ │
├═══════════════════════════════════════──┤  Resize Handle (draggable)
│ 🕐 RECENT ACTIVITY          [All][S][B] │
│ ┌─────────────────────────────────────┐ │
│ │ ✓ Completed model stage      2h ago │ │  Activity Feed
│ │   bolt-sidebar-ui-1          STAGE  │ │  (derived from
│ │                                     │ │   frontmatter dates)
│ │ ▶ Started bolt-sidebar-ui-1  3h ago │ │
│ │   bolt-sidebar-ui-1          BOLT   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Specs Tab Layout

```
┌─────────────────────────────────────────┐
│ Filter: [All Status ▼]                  │
├─────────────────────────────────────────┤
│ ▼ 📋 011-vscode-extension        [75%] │  Intent (expandable)
│   ├─ ▼ ● sidebar-provider        2/3   │  Unit (expandable)
│   │    ├─ ✓ 001-tree-view              │  Stories
│   │    ├─ ● 002-expand-collapse        │
│   │    └─ ○ 003-file-icons             │
│   └─ ▼ ✓ artifact-parser         3/3   │
│        ├─ ✓ 001-parse-frontmatter      │
│        ├─ ✓ 002-extract-status         │
│        └─ ✓ 003-validate-schema        │
└─────────────────────────────────────────┘
```

### Overview Tab Layout

```
┌─────────────────────────────────────────┐
│ OVERALL PROGRESS                        │
│ [████████████░░░░░░░░░░░░░░░░░░] 64%   │
│                                         │
│ ┌─────────┐  ┌─────────┐               │
│ │   64%   │  │   5/8   │               │
│ │Complete │  │ Stories │               │
│ └─────────┘  └─────────┘               │
│ ┌─────────┐  ┌─────────┐               │
│ │   3/5   │  │    1    │               │
│ │  Bolts  │  │ Intents │               │
│ └─────────┘  └─────────┘               │
├─────────────────────────────────────────┤
│ INTENTS                                 │
│ ┌─────────────────────────────────────┐ │
│ │ 📋 011-vscode-extension       75%   │ │
│ │    2 units | 6 stories              │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ACTIVE BOLTS                            │
│ ┌─────────────────────────────────────┐ │
│ │ ⚡ bolt-sidebar-ui-1          40%   │ │
│ │    DDD | design stage               │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## State Derivation Logic

### Activity Feed Builder

The activity feed is derived from bolt timestamps, not a separate log:

```typescript
function buildActivityFeed(bolts: Map<string, Bolt>): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const bolt of bolts.values()) {
    // Bolt created event
    if (bolt.created) {
      events.push({
        id: `${bolt.id}-created`,
        type: 'bolt-created',
        timestamp: bolt.created,
        icon: '+',
        iconClass: 'bolt-created',
        text: `Created <strong>${bolt.name}</strong>`,
        targetId: bolt.id,
        targetName: bolt.name,
        tag: 'bolt'
      });
    }

    // Bolt started event
    if (bolt.started) {
      events.push({
        id: `${bolt.id}-started`,
        type: 'bolt-start',
        timestamp: bolt.started,
        icon: '▶',
        iconClass: 'bolt-start',
        text: `Started <strong>${bolt.name}</strong>`,
        targetId: bolt.id,
        targetName: bolt.name,
        tag: 'bolt'
      });
    }

    // Stage completion events
    for (const stage of bolt.stagesCompleted) {
      events.push({
        id: `${bolt.id}-${stage.name}-complete`,
        type: 'stage-complete',
        timestamp: stage.completed,
        icon: '✓',
        iconClass: 'stage-complete',
        text: `Completed <strong>${stage.name}</strong> stage`,
        targetId: bolt.id,
        targetName: bolt.name,
        tag: 'stage'
      });
    }

    // Bolt completed event
    if (bolt.completed) {
      events.push({
        id: `${bolt.id}-completed`,
        type: 'bolt-complete',
        timestamp: bolt.completed,
        icon: '✔',
        iconClass: 'bolt-complete',
        text: `Completed <strong>${bolt.name}</strong>`,
        targetId: bolt.id,
        targetName: bolt.name,
        tag: 'bolt'
      });
    }
  }

  // Sort by timestamp descending (most recent first)
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
```

### Up Next Queue

Pending bolts ordered by dependency graph - unblocked bolts first, prioritized by how many downstream bolts they enable:

```typescript
/**
 * Determines if a bolt is blocked by checking if all required bolts are complete
 */
function isBoltBlocked(bolt: Bolt, bolts: Map<string, Bolt>): boolean {
  if (!bolt.requiresBolts || bolt.requiresBolts.length === 0) {
    return false; // No dependencies = not blocked
  }

  return bolt.requiresBolts.some(requiredId => {
    const requiredBolt = bolts.get(requiredId);
    return !requiredBolt || requiredBolt.status !== 'complete';
  });
}

/**
 * Gets the list of bolt IDs that are blocking this bolt
 */
function getBlockingBolts(bolt: Bolt, bolts: Map<string, Bolt>): string[] {
  if (!bolt.requiresBolts) return [];

  return bolt.requiresBolts.filter(requiredId => {
    const requiredBolt = bolts.get(requiredId);
    return !requiredBolt || requiredBolt.status !== 'complete';
  });
}

/**
 * Counts how many pending bolts this bolt would unblock when completed
 */
function countUnblocks(boltId: string, bolts: Map<string, Bolt>): number {
  return Array.from(bolts.values()).filter(b =>
    b.status === 'pending' &&
    b.requiresBolts?.includes(boltId)
  ).length;
}

/**
 * Gets pending bolts ordered by dependency priority:
 * 1. Unblocked bolts come first (all requiresBolts are complete)
 * 2. Among unblocked, prioritize by unblocksCount (enables more work)
 * 3. Blocked bolts come last, showing what's blocking them
 */
function getUpNextBolts(bolts: Map<string, Bolt>): Bolt[] {
  const pendingBolts = Array.from(bolts.values())
    .filter(b => b.status === 'pending')
    .map(bolt => ({
      ...bolt,
      isBlocked: isBoltBlocked(bolt, bolts),
      blockedBy: getBlockingBolts(bolt, bolts),
      unblocksCount: countUnblocks(bolt.id, bolts)
    }));

  return pendingBolts.sort((a, b) => {
    // Unblocked bolts come first
    if (a.isBlocked !== b.isBlocked) {
      return a.isBlocked ? 1 : -1;
    }

    // Among unblocked, prioritize by how many bolts they enable
    if (!a.isBlocked && !b.isBlocked) {
      return b.unblocksCount - a.unblocksCount;
    }

    // Among blocked, sort by fewest blockers (closest to being unblocked)
    return a.blockedBy.length - b.blockedBy.length;
  });
}
```

### Dependency Visualization

In the UI, blocked bolts show their blockers:

```
UP NEXT                              3 bolts
┌─────────────────────────────────────────────┐
│ 1 │ bolt-webview-panel-1      [M][D][A][I][T]│  Ready (unblocked)
│   │ Enables: 2 bolts                         │
├─────────────────────────────────────────────┤
│ 2 │ bolt-command-palette      [P][I][T]     │  Ready (unblocked)
│   │ No dependencies                          │
├─────────────────────────────────────────────┤
│ 🔒│ bolt-sidebar-provider     [M][D][A][I][T]│  Blocked
│   │ Waiting: bolt-artifact-parser-1          │
└─────────────────────────────────────────────┘
```

### Progress Calculation

```typescript
function calculateProgress(entity: { stories: Story[] }): number {
  const total = entity.stories.length;
  if (total === 0) return 0;

  const completed = entity.stories.filter(s => s.status === 'complete').length;
  return Math.round((completed / total) * 100);
}

function calculateBoltProgress(bolt: Bolt): number {
  const stages = Object.values(bolt.stages);
  const total = stages.length;
  if (total === 0) return 0;

  const completed = stages.filter(s => s === 'complete').length;
  return Math.round((completed / total) * 100);
}
```

---

## Frontmatter Schema

### Bolt Frontmatter

```yaml
---
id: bolt-sidebar-ui-1
name: Sidebar UI Implementation
type: DDD
intent: 011-vscode-extension
unit: sidebar-provider
status: active

# Dependencies
requires_bolts:
  - bolt-artifact-parser-1    # Must be complete before this bolt can start
enables_bolts:
  - bolt-sidebar-provider-1   # Will be unblocked when this bolt completes

# Timestamps (ISO 8601)
created: 2025-12-26T09:00:00Z
started: 2025-12-26T10:00:00Z
completed: null

# Stage tracking
stages:
  model: complete
  design: active
  adr: pending
  implement: pending
  test: pending

stagesCompleted:
  - name: model
    completed: 2025-12-26T10:30:00Z

# Associated stories
stories:
  - 001-create-sidebar-layout
  - 002-design-tree-view
  - 003-implement-expand-collapse
---
```

### Story Frontmatter

```yaml
---
id: 001-tree-view
name: Tree View Implementation
unit: sidebar-provider
status: complete

created: 2025-12-25T14:00:00Z
started: 2025-12-25T14:30:00Z
completed: 2025-12-25T16:00:00Z
---
```

---

## Implementation Notes

### State Update Flow

1. File watcher detects change in `memory-bank/**/*.md`
2. Parser reads and parses affected file's frontmatter
3. Metadata store updates relevant entity in state
4. Computed properties are recalculated (activity feed, progress, etc.)
5. State change event emitted
6. UI components re-render with new state

### UI Subscription Pattern

```typescript
// UI subscribes to state changes
stateStore.subscribe((state: SpecsMDState) => {
  // Re-render affected components
  renderBoltsTab(state);
  renderSpecsTab(state);
  renderOverviewTab(state);
});

// UI actions dispatch to store
function onBoltClick(boltId: string) {
  stateStore.dispatch({ type: 'EXPAND_BOLT', payload: boltId });
}
```

### Separation Boundaries

| Layer | Responsibility | Does NOT do |
|-------|----------------|-------------|
| File Watcher | Detect file changes, debounce | Parse content |
| Parser | Extract frontmatter, validate schema | Store state |
| State Store | Manage state, compute derived values | Render UI |
| UI Components | Render state, handle user input | Parse files, compute data |

---

## Visual Design Tokens

```css
/* Status Colors */
--status-complete: #22c55e;  /* Green */
--status-active: #f97316;    /* Orange */
--status-pending: #6b7280;   /* Gray */
--status-blocked: #ef4444;   /* Red */
--status-info: #3b82f6;      /* Blue */

/* Accent */
--accent-primary: #f97316;   /* Orange - brand color */

/* Stage Pipeline Icons */
DDD: M (Model) → D (Design) → A (ADR) → I (Implement) → T (Test)
Simple: P (Plan) → I (Implement) → T (Test)
```

---

## File References

- **HTML Mockup**: `variation-8-2.html`
- **Activity Timeline Variant**: `variation-8a-command-center-timeline.html`
