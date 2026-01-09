---
stage: plan
bolt: bolt-vscode-analytics-engagement-1
created: 2025-01-09T10:00:00Z
---

## Implementation Plan: Engagement Events

### Objective

Add engagement event tracking to `SpecsmdWebviewProvider._handleMessage()` to capture user interactions with the explorer view.

### Deliverables

- New file: `vs-code-extension/src/analytics/engagementEvents.ts` - Engagement tracking helper functions
- Updated types in `vs-code-extension/src/analytics/types.ts` - Event property interfaces
- Updated exports in `vs-code-extension/src/analytics/index.ts` - Export new functions
- Updated `vs-code-extension/src/sidebar/webviewProvider.ts` - Integration calls

### Dependencies

- **bolt-vscode-analytics-core-1**: Uses `tracker.track()` method (completed)
- **analytics/types.ts**: Extend with engagement event types
- **webviewProvider.ts**: Add tracking calls to message handlers

### Technical Approach

#### 1. Create Engagement Events Module

New file `engagementEvents.ts` with helper functions:
- `trackTabChanged(fromTab, toTab)` - Tab navigation
- `trackBoltAction(action, boltType, boltStatus)` - Bolt interactions
- `trackArtifactOpened(artifactType, source)` - Artifact access
- `trackFilterChanged(filterType, filterValue)` - Filter changes

#### 2. Integration Points in webviewProvider.ts

| Message Type | Line | Tracking Call |
|--------------|------|---------------|
| `tabChange` | 699 | `trackTabChanged(previousTab, message.tab)` |
| `openArtifact` | 707 | `trackArtifactOpened(message.kind, activeTab)` |
| `activityFilter` | 717 | `trackFilterChanged('activity', message.filter)` |
| `specsFilter` | 723 | `trackFilterChanged('specs', message.filter)` |
| `startBolt` | 738 | `trackBoltAction('start', boltType, 'queued')` |
| `continueBolt` | 742 | `trackBoltAction('continue', boltType, 'active')` |
| `viewBoltFiles` | 746 | `trackBoltAction('view_files', boltType, status)` |
| `openBoltMd` | 750 | `trackBoltAction('open_md', boltType, status)` |

#### 3. Event Properties

**tab_changed**:
- `from_tab`: string | null (previous tab, null on first change)
- `to_tab`: string (new active tab)

**bolt_action**:
- `action`: 'start' | 'continue' | 'view_files' | 'open_md'
- `bolt_type`: 'DDD' | 'Simple' | 'Spike' | 'unknown'
- `bolt_status`: 'active' | 'queued' | 'completed' | 'unknown'

**artifact_opened**:
- `artifact_type`: 'bolt' | 'unit' | 'story' | 'intent' | 'standard'
- `source`: 'bolts' | 'specs' | 'overview'

**filter_changed**:
- `filter_type`: 'activity' | 'specs'
- `filter_value`: string

#### 4. Privacy Constraints

- Never include bolt IDs, file paths, or artifact names
- Bolt types normalized to generic categories
- Tab/filter values are predefined UI constants

### Acceptance Criteria

- [ ] Tab changes tracked with from/to tabs
- [ ] All 4 bolt actions tracked with type and status
- [ ] Artifact opens tracked with type and source
- [ ] Activity filter changes tracked
- [ ] Specs filter changes tracked
- [ ] No file paths or IDs in events
- [ ] Helper functions follow existing tracker patterns
- [ ] Code passes linting
