---
unit: sidebar-provider
intent: 011-vscode-extension
phase: construction
status: in-progress
created: 2025-12-25
updated: 2025-12-26
default_bolt_type: simple-construction-bolt
---

# Unit Brief: Sidebar Provider

## Purpose

Implement VS Code WebviewViewProvider to render a tabbed sidebar with three views: Bolts (command center), Specs (tree hierarchy), and Overview (metrics dashboard). Handle all visual presentation, user interactions, and state management for the sidebar UI.

## Scope

### In Scope

- WebviewViewProvider implementation for tabbed sidebar
- **Bolts Tab (Command Center)**:
  - Current Intent header with bolt statistics
  - Current Focus expandable card with progress ring, stage pipeline, stories
  - Up Next queue with dependency-ordered pending bolts
  - Recent Activity section with filter and resize handle
- **Specs Tab (Tree View)**:
  - Intent → Unit → Story hierarchy
  - Progress indicators (ring charts)
  - Filter by status
  - Expand/collapse support
- **Overview Tab (Dashboard)**:
  - Overall progress metrics
  - Intents list with progress
  - Active bolts summary
- Status icon display (gray/yellow/green/red for blocked)
- Bolt type badges (DDD, Simple)
- Theme support (dark/light)
- State persistence (active tab, expanded nodes, activity height)
- Tree refresh on data changes

### Out of Scope

- File parsing (handled by artifact-parser)
- File watching (handled by file-watcher)
- Command handling (handled by extension-core)
- Welcome view (handled by welcome-view)

---

## Assigned Requirements

| FR | Requirement | Priority |
|----|-------------|----------|
| FR-1.2 | Display memory-bank artifacts in tree structure | Must |
| FR-1.5 | Display pixel logo as fadeout footer | Should |
| FR-2.1 | Intents as top-level items | Must |
| FR-2.2 | Units nested under intents | Must |
| FR-2.3 | Stories nested under units | Must |
| FR-2.4 | Bolts in separate section with unit grouping | Must |
| FR-2.5 | Standards in separate section | Must |
| FR-2.6 | Expand/collapse for all parent nodes | Must |
| FR-2.7 | Sort intents by number prefix | Must |
| FR-2.8 | Configurable bolt sorting | Must |
| FR-3.5 | Status icons (gray/yellow/green/?) | Must |
| FR-8.1 | Three tabs: Bolts, Specs, Overview | Must |
| FR-8.2 | Bolts tab shows command center | Must |
| FR-8.3 | Specs tab shows hierarchy tree | Must |
| FR-8.4 | Overview tab shows metrics dashboard | Must |
| FR-8.5 | Tab state persistence | Must |
| FR-8.6 | Theme support (dark/light) | Must |
| FR-9.1 | Current Intent header with statistics | Must |
| FR-9.2 | Current Focus expandable card | Must |
| FR-9.3 | Progress ring, pipeline, stories in focus card | Must |
| FR-9.4 | Up Next queue section | Must |
| FR-9.5 | Dependency-ordered queue | Must |
| FR-9.6 | Blocked bolt indication | Must |
| FR-9.7 | Recent Activity section | Must |
| FR-9.8 | Activity filter (All/Stages/Bolts) | Must |
| FR-9.9 | Resizable activity panel | Should |
| FR-9.10 | Activity height persistence | Should |
| FR-11.4 | Activity item display (icon, text, time) | Must |

---

## Domain Concepts

### Key Entities

| Entity | Description | Attributes |
|--------|-------------|------------|
| SpecsmdWebviewProvider | Main provider class | extensionUri, state, webview |
| SidebarState | UI state object | activeTab, expandedNodes, activityFilter, activityHeight |
| FocusCard | Active bolt display | bolt, progress, stages, stories, expanded |
| QueueItem | Pending bolt in queue | bolt, priority, isBlocked, blockedBy |
| ActivityItem | Activity feed item | event, icon, text, target, tag, time |
| ProgressRing | Circular progress | percent, size, color |
| StagePipeline | Stage visualization | stages[], currentStage |
| TreeNode | Base tree item | id, label, type, children, status |
| IntentNode | Intent tree item | intent data, units[], progress |
| UnitNode | Unit tree item | unit data, stories[], progress |

### Key Operations

| Operation | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| resolveWebviewView | Create webview content | WebviewView | void |
| getHtmlContent | Generate HTML for webview | state, data | string |
| handleMessage | Process webview messages | message | void |
| switchTab | Change active tab | tabId | void |
| toggleExpand | Toggle node expansion | nodeId | void |
| setActivityFilter | Filter activity feed | filter | void |
| resizeActivity | Handle activity resize | height | void |
| renderBoltsTab | Render command center | state, data | string |
| renderSpecsTab | Render tree hierarchy | state, data | string |
| renderOverviewTab | Render metrics dashboard | state, data | string |
| getStatusIcon | Get icon class for status | ArtifactStatus | string |
| formatRelativeTime | Format timestamp | Date | string |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 10 |
| Must Have | 9 |
| Should Have | 1 |
| Could Have | 0 |

### Stories

| Story ID | Title | Priority | Status |
|----------|-------|----------|--------|
| 001 | Tree Data Provider Setup | Must | Complete |
| 002 | Intent/Unit/Story Tree | Must | Complete |
| 003 | Bolt Tree with Stages and Stories | Must | Planned |
| 004 | Status Icons and Badges | Must | Planned |
| 005 | Pixel Logo Footer | Should | Planned |
| 006 | Webview Tab Architecture | Must | Planned |
| 007 | Command Center (Bolts Tab) | Must | Planned |
| 008 | Current Focus Card | Must | Planned |
| 009 | Up Next Queue with Dependencies | Must | Planned |
| 010 | Activity Feed UI | Must | Planned |

---

## Dependencies

### Depends On

| Unit | Reason |
|------|--------|
| artifact-parser | Gets parsed artifact data |
| file-watcher | Subscribes to refresh events |

### Depended By

| Unit | Reason |
|------|--------|
| extension-core | Registers provider |

### External Dependencies

| System | Purpose | Risk |
|--------|---------|------|
| VS Code TreeView API | Tree rendering | Low |
| VS Code Webview API | Logo footer | Low |

---

## Technical Context

### Suggested Technology

- vscode.WebviewViewProvider interface
- HTML/CSS/JS for webview content
- VS Code CSS variables for theming
- PostMessage API for webview ↔ extension communication
- VS Code workspaceState for persistence

### Integration Points

| Integration | Type | Protocol |
|-------------|------|----------|
| VS Code WebviewView | API | WebviewViewProvider |
| artifact-parser | Import | TypeScript |
| file-watcher | Event | Callback/EventEmitter |
| extension-core | Commands | VS Code commands |

### Data Storage

| Data | Type | Volume | Retention |
|------|------|--------|-----------|
| UI state | In-memory | Small | Session |
| Tab/expand state | workspaceState | Tiny | Persistent |
| Activity height | workspaceState | Tiny | Persistent |

---

## Constraints

- Must use WebviewViewProvider for tabbed interface (TreeView doesn't support tabs)
- Must use VS Code CSS variables for proper theme support
- Webview content must be secure (CSP headers, nonce for scripts)
- Must handle webview disposal and re-creation gracefully
- Activity panel resize must feel native (smooth, responsive)

---

## Success Criteria

### Functional

- [ ] Three tabs display and switch correctly
- [ ] Bolts tab shows command center layout
- [ ] Current Focus card displays active bolt with progress ring
- [ ] Stage pipeline shows all stages with correct status
- [ ] Up Next queue orders bolts by dependency priority
- [ ] Blocked bolts show blocker indication
- [ ] Activity feed displays events with correct formatting
- [ ] Activity filter works (All/Stages/Bolts)
- [ ] Activity panel resizable with drag handle
- [ ] Specs tab shows Intent → Unit → Story tree
- [ ] Overview tab shows aggregate metrics
- [ ] Tab state persists across sessions
- [ ] Expand/collapse state persists
- [ ] Theme switching works (dark/light)
- [ ] UI refreshes on file changes

### Non-Functional

- [ ] Initial render < 300ms
- [ ] Tab switch < 100ms
- [ ] Smooth resize animations (60fps)
- [ ] Proper theme variable usage

### Quality

- [ ] Unit tests for render functions
- [ ] Unit tests for state management
- [ ] Visual regression tests (screenshots)
- [ ] Code coverage > 80%

---

## Bolt Suggestions

| Bolt | Type | Stories | Objective |
|------|------|---------|-----------|
| bolt-sidebar-provider-1 | Simple | 001, 002 | Basic tree structure (COMPLETE) |
| bolt-sidebar-provider-2 | Simple | 003, 004, 005 | Bolts, status, footer (COMPLETE) |
| bolt-sidebar-provider-3 | Simple | 006, 007 | Webview architecture + command center |
| bolt-sidebar-provider-4 | Simple | 008, 009, 010 | Focus card, queue, activity UI |

---

## Notes

- **Design Reference**: `vs-code-extension/design-mockups/variation-8-2.html`
- **Spec Document**: `vs-code-extension/design-mockups/variation-8-2-spec.md`
- Tabbed UI visualization:
```
┌─────────────────────────────────────────┐
│ SpecsMD                        [↻] [⚙]  │
├─────────────────────────────────────────┤
│  ⚡ Bolts  │  📋 Specs  │  📊 Overview  │
├─────────────────────────────────────────┤
│ CURRENT INTENT: 011-vscode-extension    │
│ ● 1 Active  ○ 2 Queued  ✓ 3 Done       │
├─────────────────────────────────────────┤
│ 🎯 CURRENT FOCUS                        │
│ ┌─────────────────────────────────────┐ │
│ │ bolt-sidebar-ui-1     [In Progress] │ │
│ │ [Progress Ring 40%] Design Stage    │ │
│ │ [M]✓─[D]●─[A]○─[I]○─[T]○           │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ UP NEXT                        2 bolts  │
│ 1 │ bolt-webview-panel-1 (unblocked)   │
│ 🔒│ bolt-x (blocked by: bolt-y)        │
├═══════════════════════════════════════──┤
│ 🕐 RECENT ACTIVITY     [All][S][B]      │
│ ✓ Completed model stage      2h ago    │
│ ▶ Started bolt-sidebar-ui    3h ago    │
└─────────────────────────────────────────┘
```
- Use VS Code CSS variables for theming: `--vscode-*`
- WebviewViewProvider for sidebar webview
- PostMessage API for communication
