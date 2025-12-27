---
intent: vscode-extension
phase: construction
status: construction
created: 2025-12-25
updated: 2025-12-26
---

# Requirements: VS Code Extension

## Intent Overview

Create a VS Code extension ("specsmd extension") that provides a dashboard sidebar for browsing and managing AI-DLC memory-bank artifacts. The extension displays intents, units, stories, bolts, and standards in a hierarchical tree view with real-time status indicators and file watching.

**Extension Name**: specsmd extension
**Location**: `vs-code-extension/` folder in specsmd root
**Workspace**: Single workspace only (no multi-root support)

**Inspiration**: fabriqa-markdown-editor sidebar patterns (separate project, not a fork)

## Business Goals

| Goal | Success Metric | Priority |
|------|----------------|----------|
| Enable visual navigation of memory-bank | Users can browse all artifacts in sidebar | Must |
| Show AI-DLC progress at a glance | Status indicators visible for all artifacts | Must |
| Real-time updates | Sidebar reflects file changes within 1 second | Must |
| Reduce context switching | Users stay in VS Code for AI-DLC workflow | Should |

---

## Functional Requirements

### FR-1: Sidebar Dashboard

- FR-1.1: Extension SHALL provide a sidebar view in VS Code activity bar
- FR-1.2: Sidebar SHALL display memory-bank artifacts in a tree structure
- FR-1.3: Sidebar SHALL be titled "specsmd" with icon from `docs.specs.md/images/favicon.png`
- FR-1.4: Sidebar SHALL auto-detect specsmd projects (presence of `memory-bank/` or `.specsmd/`)
- FR-1.5: Sidebar SHALL display specs.md pixel logo (`src/logo.png`) as fadeout footer at bottom
- FR-1.6: Sidebar SHALL have a refresh icon button in the title bar actions

### FR-2: Artifact Tree Structure

- FR-2.1: Tree SHALL display **Intents** as top-level items under "Intents" section
- FR-2.2: Tree SHALL display **Units** nested under their parent intent
- FR-2.3: Tree SHALL display **Stories** nested under their parent unit
- FR-2.4: Tree SHALL display **Bolts** in a separate "Bolts" section with unit grouping
- FR-2.5: Tree SHALL display **Standards** in a separate "Standards" section
- FR-2.6: Tree SHALL support expand/collapse for all parent nodes
- FR-2.7: Intents SHALL be sorted by number prefix (001, 002, 003...)
- FR-2.8: Bolts SHALL support configurable sorting:
  - Default: In-progress first, then by number
  - Option: Group by status (each group sorted by number)
  - User can toggle between sort modes via context menu or settings

### FR-3: Status Indicators

- FR-3.1: Intents SHALL show status (draft, in-progress, complete)
- FR-3.2: Units SHALL show completion status based on stories/bolts
- FR-3.3: Stories SHALL show status (pending, in-progress, done)
- FR-3.4: Bolts SHALL display:
  - Status icon (planned/in-progress/completed) with color
  - Bolt type badge (e.g., "DDD", "Simple") as small text
  - Current stage name inline
  - Expandable to show:
    - **Stages** section: ALL stages as child nodes with individual status
    - **Stories** section: Stories assigned to this bolt
  - Stages and Stories SHALL be visually differentiated (different icons/grouping)
- FR-3.5: Status SHALL be visually indicated via icons:
  - Draft/Pending = gray circle
  - In-Progress = yellow spinner
  - Complete/Done = green checkmark
  - Invalid/Unknown = yellow "?" icon with tooltip explaining the issue

### FR-4: File Operations

- FR-4.1: Single-clicking an artifact SHALL select it in the tree
- FR-4.2: Double-clicking an artifact SHALL open it in VS Code's default editor for that file type
- FR-4.3: Extension SHALL NOT provide custom editors in Phase 1
- FR-4.4: Extension SHALL support "Reveal in Explorer" context menu
- FR-4.5: Extension SHALL support "Copy Path" context menu

### FR-5: File Watching

- FR-5.1: Extension SHALL watch `memory-bank/` directory for changes
- FR-5.2: Extension SHALL update tree view when files are added, modified, or deleted
- FR-5.3: Extension SHALL update status indicators when artifact frontmatter changes
- FR-5.4: Extension SHALL debounce rapid file changes (100ms)

### FR-6: Memory Bank Parsing

- FR-6.1: Extension SHALL use a central `MemoryBankSchema` class for all path/structure definitions
- FR-6.2: `MemoryBankSchema` SHALL define hardcoded paths for Phase 1 (intents, units, stories, bolts, standards)
- FR-6.3: `MemoryBankSchema` SHALL be designed for easy future migration to dynamic `memory-bank.yaml` discovery
- FR-6.4: Extension SHALL parse artifact frontmatter for status fields
- FR-6.5: Extension SHALL handle missing or malformed frontmatter gracefully
- FR-6.6: Extension SHALL support standard memory-bank directory structure:
  - `memory-bank/intents/{NNN}-{name}/` - Intent folders
  - `memory-bank/intents/{intent}/units/{unit}/` - Unit folders
  - `memory-bank/intents/{intent}/units/{unit}/stories/` - Story files
  - `memory-bank/bolts/bolt-{unit}-{N}/` - Bolt folders
  - `memory-bank/standards/` - Standards files

### FR-7: Project Detection & Installation

- FR-7.1: Extension SHALL detect if workspace lacks specsmd (no `memory-bank/` AND no `.specsmd/`)
- FR-7.2: When no specsmd detected, sidebar SHALL show welcome view with:
  - specs.md pixel logo (`src/logo.png`) - clickable, links to https://specs.md
  - Brief explanation of what specsmd is
  - Embedded quickstart video (https://asciinema.org/a/763995)
  - "Quickstart Guide" link to specs.md quickstart page
  - "Install" button
  - Copyable command text (`npx specsmd@latest install`) for manual copy without clicking Install
- FR-7.3: When user clicks "Install", extension SHALL show confirmation dialog
- FR-7.4: Upon confirmation, extension SHALL open VS Code integrated terminal
- FR-7.5: Extension SHALL paste `npx specsmd@latest install` command in terminal
- FR-7.6: Extension SHALL NOT auto-execute command (user must press Enter)
- FR-7.7: After installation detected (folders appear), sidebar SHALL auto-refresh to show artifacts

### FR-8: Tab-Based Sidebar Architecture

- FR-8.1: Sidebar SHALL display three tabs: **Bolts**, **Specs**, **Overview**
- FR-8.2: **Bolts tab** SHALL show command center (current focus, queue, activity)
- FR-8.3: **Specs tab** SHALL show Intent → Unit → Story hierarchy tree
- FR-8.4: **Overview tab** SHALL show aggregate progress metrics and dashboards
- FR-8.5: Active tab state SHALL persist across VS Code sessions
- FR-8.6: Tabs SHALL use VS Code theming (dark/light mode support)

### FR-9: Command Center (Bolts Tab)

- FR-9.1: SHALL display "Current Intent" header with bolt statistics (active/queued/done counts)
- FR-9.2: SHALL display "Current Focus" expandable card for the active bolt
- FR-9.3: Current Focus card SHALL show:
  - Progress ring visualization (percentage complete)
  - Stage pipeline with status indicators (complete/active/pending)
  - Stories checklist with completion status
  - "Continue" and "Files" action buttons
- FR-9.4: SHALL display "Up Next" queue section showing pending bolts
- FR-9.5: Up Next queue SHALL order bolts by dependency priority:
  - Unblocked bolts first (all `requires_bolts` complete)
  - Among unblocked, prioritize by `enables_bolts` count (enables more work first)
  - Blocked bolts shown last with blocker indication
- FR-9.6: Blocked bolts SHALL display which bolts are blocking them
- FR-9.7: SHALL display "Recent Activity" section with activity feed
- FR-9.8: Activity feed SHALL support filtering: All, Stages, Bolts
- FR-9.9: Activity section SHALL be resizable via drag handle (min 120px, max 500px)
- FR-9.10: Activity section height SHALL persist across sessions

### FR-10: Bolt Dependencies

- FR-10.1: Parser SHALL read `requires_bolts` field from bolt frontmatter
- FR-10.2: Parser SHALL read `enables_bolts` field from bolt frontmatter
- FR-10.3: Parser SHALL compute `isBlocked` for pending bolts (true if any `requires_bolts` incomplete)
- FR-10.4: Parser SHALL compute `blockedBy` list (IDs of incomplete required bolts)
- FR-10.5: Parser SHALL compute `unblocksCount` (number of bolts this bolt enables)
- FR-10.6: Status "blocked" SHALL be distinct from "pending" in UI

### FR-11: Activity Feed

- FR-11.1: Activity feed SHALL be derived from bolt timestamp fields (no separate log)
- FR-11.2: Activity event types:
  - `bolt-created`: from `created` timestamp
  - `bolt-start`: from `started` timestamp
  - `stage-complete`: from `stages_completed[].completed` timestamps
  - `bolt-complete`: from `completed` timestamp
- FR-11.3: Activity feed SHALL be sorted by timestamp descending (most recent first)
- FR-11.4: Activity items SHALL display: icon, description, target bolt, tag (bolt/stage), relative time
- FR-11.5: Activity feed SHALL update when file watcher detects bolt changes

---

## Future Requirements (Phase 2+)

### FR-12: Bolt Actions (Future)

- FR-12.1: Bolts SHALL have context menu with "Start Bolt" action
- FR-12.2: "Start Bolt" SHALL copy command to clipboard for pasting in AI chat
- FR-12.3: Bolts SHALL have context menu with "View Progress" action
- FR-12.4: Extension MAY provide quick-pick command palette for bolt operations

### FR-13: Custom Editors (Future)

- FR-13.1: Extension MAY provide custom editor for bolt.md files
- FR-13.2: Extension MAY provide custom editor for story files
- FR-13.3: Custom editors MAY show rich UI for status, stages, acceptance criteria

---

## Non-Functional Requirements

### Performance

| Requirement | Metric | Target |
|-------------|--------|--------|
| Tree load time | Initial render | < 500ms for 100 artifacts |
| File watch response | Update latency | < 1 second |
| Memory usage | Extension footprint | < 50MB |

### Usability

| Requirement | Description |
|-------------|-------------|
| Discoverability | Extension visible in activity bar with clear icon |
| Consistency | Follow VS Code UX patterns for tree views |
| Accessibility | Support keyboard navigation |

### Compatibility

| Requirement | Target |
|-------------|--------|
| VS Code version | ^1.85.0 (matches fabriqa-markdown-editor) |
| Node.js | LTS versions |
| Platform | macOS, Windows, Linux |

### Maintainability

| Requirement | Description |
|-------------|-------------|
| Code style | TypeScript, ESLint, follow specsmd coding standards |
| Testing | Unit tests for tree providers, parsing logic |
| Build | esbuild (fast bundling) |

---

## Constraints

### Technical Constraints

- Extension must be a separate VS Code extension, not part of CLI
- Must use VS Code Extension API (not webview for sidebar)
- Must handle projects without `.specsmd/` folder (standalone memory-bank)

### Business Constraints

- Phase 1 focuses on read-only dashboard (no artifact creation/editing)
- Must not conflict with fabriqa-markdown-editor if both installed

---

## Assumptions

| Assumption | Risk if Invalid | Mitigation |
|------------|-----------------|------------|
| memory-bank structure is stable | Parser breaks | Version schema in memory-bank.yaml |
| Users have memory-bank/ in workspace root | Extension won't detect project | Support configurable path |
| Frontmatter follows YAML format | Parsing fails | Graceful fallback to "unknown" status |

---

## Resolved Questions

| Question | Resolution |
|----------|------------|
| Should extension work with multi-root workspaces? | **No** - Single workspace only |
| Should bolts show all stages or just current? | **All stages** - Show all with current highlighted |
| Extension name? | **"specsmd extension"** |
| Sort intents by number or alphabetically? | **Number prefix** (001, 002...) |
| Sort bolts by status or name? | **In-progress first**, then by number; configurable grouping |
| User-configurable settings needed? | **None for Phase 1** (bolt sort toggle only) |
| What to show for invalid frontmatter? | **"?" icon** with tooltip explaining the issue |
| Bolt location in tree? | **Separate "Bolts" section** (not nested under units) |
| Bolt stages display? | **Expandable** - current stage inline, expand to see all stages |
| Show bolt type? | **Yes** - small badge text (DDD, Simple, etc.) |
| Empty state UI? | **Welcome view** - logo (links to specs.md), explanation, Install button, copyable command |
| Bolt expansion content? | **Stages + Stories** - visually differentiated |
| Sidebar structure? | **Three tabs**: Bolts (command center), Specs (tree), Overview (metrics) |
| Activity feed source? | **Derived from bolt timestamps** - no separate activity log needed |
| Up Next queue ordering? | **Dependency-based**: unblocked first, then by enables_bolts count |
| Blocked bolt display? | **Show blockers**: display which bolts are blocking in queue |
| Activity panel sizing? | **Resizable**: drag handle, 120-500px range, persisted |
| Progress visualization? | **Ring chart** for bolt progress, **pipeline** for stages |

---

## Out of Scope (Phase 1)

- Custom markdown editors
- Artifact creation/deletion from sidebar
- Integration with AI chat (future phase)
- Bolt execution from extension
- Git integration for artifact versioning
