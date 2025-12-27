# Implementation Walkthrough: Dependency Parsing & Activity Feed

## Overview

This document describes the Stage 2 implementation for bolt-artifact-parser-2, which adds bolt dependency parsing and activity feed derivation to the parser module.

## Files Changed

### 1. `vs-code-extension/src/parser/types.ts`

**Changes:**
- Added `Blocked` status to `ArtifactStatus` enum (line 14)
- Extended `Stage` interface with timestamp fields:
  - `completedAt?: Date` - When stage was completed
  - `artifact?: string` - Artifact produced by the stage
- Extended `Bolt` interface with dependency fields:
  - `requiresBolts: string[]` - Bolt IDs that must complete first
  - `enablesBolts: string[]` - Bolt IDs this bolt enables
  - `isBlocked: boolean` - Computed: true if any required bolts are incomplete
  - `blockedBy: string[]` - Computed: IDs of incomplete required bolts
  - `unblocksCount: number` - Computed: number of bolts this enables
- Extended `Bolt` interface with timestamp fields:
  - `createdAt?: Date` - When bolt was created
  - `startedAt?: Date` - When bolt was started
  - `completedAt?: Date` - When bolt was completed
- Added `ActivityEventType` type for event classification
- Added `ActivityEvent` interface for activity feed items

### 2. `vs-code-extension/src/parser/artifactParser.ts`

**Changes:**
- Added `parseTimestamp()` helper function (lines 40-55) for safe ISO 8601 parsing
- Updated `parseBolt()` function to:
  - Parse `requires_bolts` and `enables_bolts` arrays from frontmatter
  - Parse `stages_completed` with timestamp data from nested objects
  - Parse bolt-level timestamps (`created`, `started`, `completed`)
  - Initialize dependency computed fields with defaults (computed later)

### 3. `vs-code-extension/src/parser/dependencyComputation.ts` (NEW)

**Purpose:** Computes dependency state for all bolts after parsing.

**Functions:**
- `computeBoltDependencies(bolts: Bolt[]): Bolt[]`
  - Creates status lookup map for O(1) access
  - Computes `unblocksCount` for each bolt
  - Computes `isBlocked` and `blockedBy` based on required bolt statuses
  - Updates status to `Blocked` if appropriate

- `getUpNextBolts(bolts: Bolt[]): Bolt[]`
  - Filters to Draft/Blocked bolts only
  - Sorts by: unblocked first, then by unblocksCount descending

- `isBoltBlocked(bolt: Bolt, allBolts: Bolt[]): boolean`
  - Checks if any required bolts are incomplete

- `getBlockingBolts(bolt: Bolt, allBolts: Bolt[]): string[]`
  - Returns IDs of incomplete required bolts

- `countUnblocks(boltId: string, allBolts: Bolt[]): number`
  - Counts how many bolts require this bolt

### 4. `vs-code-extension/src/parser/activityFeed.ts` (NEW)

**Purpose:** Derives activity events from bolt timestamps for the command center UI.

**Functions:**
- `buildActivityFeed(bolts: Bolt[]): ActivityEvent[]`
  - Iterates bolts, creates events from timestamps
  - Event types: bolt-created, bolt-start, stage-complete, bolt-complete
  - Returns sorted by timestamp descending (most recent first)

- `filterActivityEvents(events: ActivityEvent[], tag: 'all' | 'bolt' | 'stage'): ActivityEvent[]`
  - Filters events by category tag

- `limitActivityEvents(events: ActivityEvent[], limit: number): ActivityEvent[]`
  - Limits to most recent N events

- `formatRelativeTime(timestamp: Date, now?: Date): string`
  - Formats: "Just now", "5m ago", "2h ago", "Yesterday", "3d ago"

**Constants:**
- `EVENT_ICONS` - Maps event types to icon and CSS class

### 5. `vs-code-extension/src/parser/index.ts`

**Changes:**
- Added exports for `ActivityEvent` and `ActivityEventType` from types
- Added exports for all functions from `dependencyComputation.ts`
- Added exports for all functions from `activityFeed.ts`

### 6. `vs-code-extension/src/sidebar/iconHelper.ts`

**Changes:**
- Added `Blocked` status icon configuration:
  - Uses `circle-filled` icon
  - Uses `charts.red` color

### 7. `vs-code-extension/src/sidebar/types.ts`

**Changes:**
- Added `Blocked` status indicator (`\u2717` - X mark)

### 8. Test Files Updated

- `src/test/sidebar/treeBuilder.test.ts` - Added required dependency fields to mock Bolt objects
- `src/test/sidebar/types.test.ts` - Added required dependency fields to mock Bolt objects

## Data Flow

```
1. scanMemoryBank() calls parseBolt() for each bolt folder
   └── parseBolt() extracts dependency arrays and timestamps from frontmatter

2. After scanning, call computeBoltDependencies(bolts)
   └── Computes isBlocked, blockedBy, unblocksCount for all bolts

3. For Up Next queue, call getUpNextBolts(bolts)
   └── Returns prioritized list of pending bolts

4. For Activity Feed, call buildActivityFeed(bolts)
   └── Derives events from timestamps, sorted by recency
```

## Frontmatter Schema

The bolt.md frontmatter now supports:

```yaml
---
status: draft
type: simple-construction-bolt
# Dependency fields
requires_bolts:
  - bolt-other-1
enables_bolts:
  - bolt-dependent-2
# Timestamp fields
created: 2025-01-15T10:00:00Z
started: 2025-01-15T11:00:00Z
completed: null
# Stage completion with timestamps
stages_completed:
  - name: plan
    completed: 2025-01-15T11:30:00Z
    artifact: implementation-plan.md
---
```

## Testing

All 122 existing tests pass. New functionality is covered by:
- Type compatibility tests (mock objects include new required fields)
- The new modules are pure functions suitable for unit testing in Stage 3
