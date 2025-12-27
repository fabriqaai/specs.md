---
stage: plan
bolt: bolt-artifact-parser-2
created: 2025-12-26T11:00:00Z
---

## Implementation Plan: Artifact Parser - Dependency & Activity

### Objective

Extend the existing artifact parser to support bolt dependency parsing and activity feed derivation. This enables the command center UI to display dependency-ordered queues and activity timelines.

### Deliverables

1. **Extended Bolt Interface** - Add dependency and activity fields to types.ts
2. **Dependency Parsing** - Parse `requires_bolts` and `enables_bolts` from frontmatter
3. **Dependency Computation** - Calculate `isBlocked`, `blockedBy`, `unblocksCount` for each bolt
4. **Activity Event Interface** - Define ActivityEvent type
5. **Activity Feed Builder** - Derive activity events from bolt timestamps
6. **Up Next Queue Builder** - Get pending bolts ordered by priority

### Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| Existing `types.ts` | Internal | Base types to extend |
| Existing `artifactParser.ts` | Internal | `parseBolt()` to enhance |
| Existing `frontmatterParser.ts` | Internal | Already parses arrays correctly |

### Technical Approach

#### 1. Type Extensions (types.ts)

```typescript
// Extend Bolt interface with dependency fields
interface Bolt {
  // ... existing fields ...
  requiresBolts: string[];    // IDs of required bolts
  enablesBolts: string[];     // IDs of bolts this enables
  isBlocked: boolean;         // Computed: are any requires incomplete?
  blockedBy: string[];        // Computed: IDs of incomplete requires
  unblocksCount: number;      // Computed: how many bolts this enables
}

// New ActivityEvent interface
interface ActivityEvent {
  id: string;
  type: 'bolt-created' | 'bolt-start' | 'stage-complete' | 'bolt-complete';
  timestamp: Date;
  icon: string;
  iconClass: string;
  text: string;
  targetId: string;
  targetName: string;
  tag: 'bolt' | 'stage';
}

// Add 'Blocked' to ArtifactStatus enum
enum ArtifactStatus {
  // ... existing ...
  Blocked = 'blocked'
}
```

#### 2. Dependency Parsing (artifactParser.ts)

Modify `parseBolt()` to extract:
- `requires_bolts` → `requiresBolts: string[]`
- `enables_bolts` → `enablesBolts: string[]`

Handle missing fields gracefully (default to empty array).

#### 3. Dependency Computation (new: dependencyComputation.ts)

```typescript
// After all bolts are parsed, compute dependency state
function computeBoltDependencies(bolts: Bolt[]): Bolt[] {
  // Create status lookup map
  const boltStatusMap = new Map(bolts.map(b => [b.id, b.status]));

  return bolts.map(bolt => {
    // Skip if already complete
    if (bolt.status === ArtifactStatus.Complete) {
      return { ...bolt, isBlocked: false, blockedBy: [], unblocksCount: 0 };
    }

    // Check blocking
    const blockedBy = bolt.requiresBolts.filter(reqId => {
      const status = boltStatusMap.get(reqId);
      return status !== ArtifactStatus.Complete;
    });

    const isBlocked = blockedBy.length > 0;

    // Count how many bolts this enables
    const unblocksCount = bolts.filter(b =>
      b.requiresBolts.includes(bolt.id)
    ).length;

    return { ...bolt, isBlocked, blockedBy, unblocksCount };
  });
}
```

#### 4. Activity Feed Builder (new: activityFeed.ts)

```typescript
function buildActivityFeed(bolts: Bolt[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const bolt of bolts) {
    // bolt-created event
    if (bolt.created) {
      events.push(createEvent('bolt-created', bolt, bolt.created));
    }

    // bolt-start event
    if (bolt.started) {
      events.push(createEvent('bolt-start', bolt, bolt.started));
    }

    // stage-complete events
    for (const stage of bolt.stagesCompleted) {
      if (stage.completed) {
        events.push(createStageEvent(bolt, stage));
      }
    }

    // bolt-complete event
    if (bolt.completed) {
      events.push(createEvent('bolt-complete', bolt, bolt.completed));
    }
  }

  // Sort by timestamp descending
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
```

#### 5. Up Next Queue (in dependencyComputation.ts)

```typescript
function getUpNextBolts(bolts: Bolt[]): Bolt[] {
  return bolts
    .filter(b => b.status === ArtifactStatus.Draft ||
                 b.status === ArtifactStatus.Blocked)
    .sort((a, b) => {
      // Unblocked first
      if (!a.isBlocked && b.isBlocked) return -1;
      if (a.isBlocked && !b.isBlocked) return 1;
      // Then by unblocksCount (more impact first)
      return b.unblocksCount - a.unblocksCount;
    });
}
```

### File Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `src/parser/types.ts` | Modify | Add dependency fields to Bolt, add ActivityEvent, add Blocked status |
| `src/parser/artifactParser.ts` | Modify | Parse requires_bolts, enables_bolts in parseBolt() |
| `src/parser/dependencyComputation.ts` | Create | computeBoltDependencies(), getUpNextBolts() |
| `src/parser/activityFeed.ts` | Create | buildActivityFeed(), ActivityEvent helpers |
| `src/parser/index.ts` | Modify | Export new functions |

### Acceptance Criteria

- [ ] Bolt.requiresBolts parsed from frontmatter
- [ ] Bolt.enablesBolts parsed from frontmatter
- [ ] Bolt.isBlocked computed correctly
- [ ] Bolt.blockedBy contains correct IDs
- [ ] Bolt.unblocksCount computed correctly
- [ ] ActivityEvent created for bolt-created
- [ ] ActivityEvent created for bolt-start
- [ ] ActivityEvent created for stage-complete (each stage)
- [ ] ActivityEvent created for bolt-complete
- [ ] Activity feed sorted by timestamp descending
- [ ] Missing timestamps handled gracefully (skip event)
- [ ] Missing dependency fields handled gracefully (empty array)
- [ ] All existing tests still pass

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Stage completed data format varies | Check both array of strings and array of objects |
| Missing timestamps | Skip event, don't throw |
| Circular dependencies | Mark both as blocked (no special handling needed) |
| Large number of bolts (performance) | O(n) algorithms, single pass where possible |

### Notes

- The Bolt interface already has `stagesCompleted: string[]` but frontmatter has `stages_completed: [{name, completed, artifact}]`
- Need to enhance parsing to capture the `completed` timestamp from each stage
- Consider creating a `StageCompleted` interface for richer stage data
