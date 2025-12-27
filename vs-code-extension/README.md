# SpecsMD VS Code Extension

[![VS Code Extension CI/Release](https://github.com/fabriqaai/specs.md/actions/workflows/vscode-publish.yml/badge.svg)](https://github.com/fabriqaai/specs.md/actions/workflows/vscode-publish.yml)

A VS Code extension for managing AI-DLC (AI Development Life Cycle) artifacts including intents, units, stories, and bolts.

## Sidebar Views

The extension provides a sidebar panel with three tabs:

### Bolts Tab

The default view showing bolt execution status and progress.

#### Current Focus Section

Shows active bolts being worked on with stage progress.

**Selection Rules:**
1. Shows **all bolts** with `status: in-progress`
2. Sorted by `startedAt` timestamp (most recently started first)
3. Multiple active bolts are supported (all shown in expandable cards)

**Data Displayed:**
- Bolt name and type (DDD, Simple, Spike)
- Current stage name
- Progress ring showing stages complete percentage
- Stage pipeline with status indicators
- Stories list with completion status

#### Up Next Queue

Shows pending bolts ready to be started.

**Selection Rules (Priority Order):**
1. **Unblocked bolts first** - Bolts with no incomplete dependencies
2. **Higher impact first** - Among unblocked, sorted by `unblocksCount` (bolts that enable more work)
3. **Blocked bolts last** - Bolts waiting on other bolts
4. **Alphabetical** - Final tiebreaker by bolt ID

**Blocking Logic:**
- A bolt is **blocked** if any bolt in its `requires_bolts` array has `status != complete`
- `blockedBy` shows which bolts are blocking this one
- `unblocksCount` shows how many bolts are waiting for this one

**Display Limit:** Top 5 bolts shown

#### Recent Activity

Timeline of bolt and stage completions.

**Event Types:**
| Event | Source | Icon |
|-------|--------|------|
| `bolt-created` | `created` timestamp in bolt frontmatter | + |
| `bolt-start` | `started` timestamp in bolt frontmatter | ▶ |
| `stage-complete` | `completed` timestamp in stage entry | ✓ |
| `bolt-complete` | `completed` timestamp in bolt frontmatter | ✔ |

**Selection Rules:**
1. Events derived from bolt timestamps (created, started, completed)
2. Stage completion events from each stage's `completed` field
3. Sorted by timestamp descending (most recent first)
4. Limited to 10 most recent events

**Filtering Options:**
- **All** - All event types
- **Stages** - Only stage completion events (`tag: stage`)
- **Bolts** - Only bolt-level events (`tag: bolt`)

---

### Specs Tab

Hierarchical view of your project's specifications.

**Hierarchy:**
```
Intent (🎯) → Units (📚) → Stories (📝)
```

**Features:**
- Click intent/unit headers to expand/collapse children
- Click the magnifier icon (🔍) next to an intent to open `requirements.md`
- Click the magnifier icon (🔍) next to a unit to open `unit-brief.md`
- Click a story to open the story markdown file
- Progress indicators show completion percentage for each intent

**Status Indicators:**
| Status | Icon | Color |
|--------|------|-------|
| Complete | ✓ | Green |
| Active | ● | Orange |
| Pending | (empty) | Gray dashed |

---

### Overview Tab

High-level project metrics and quick actions.

#### Project Metrics

**Calculated Values:**
- **Active Bolts** - Count of bolts with `status: in-progress`
- **Queued Bolts** - Count of bolts with `status: draft`
- **Completed Bolts** - Count of bolts with `status: complete`
- **Blocked Bolts** - Count of bolts with `status: blocked` or `isBlocked: true`

**Overall Progress:**
- Percentage = `completedStories / totalStories * 100`

#### Suggested Actions

AI-recommended next steps based on current project state.

**Action Types and Selection Rules:**

| Priority | Action | Condition |
|----------|--------|-----------|
| 1 | **Continue Current Bolt** | Active bolt exists (`status: in-progress`) |
| 1 | **Start Next Bolt** | No active bolt AND unblocked bolts in queue |
| 2 | **Complete Stage** | Active bolt has a `currentStage` set |
| 3 | **Unblock Multiple Bolts** | A blocking bolt would unblock 2+ waiting bolts |
| 4 | **Create Bolt for Pending Work** | Intent has pending stories but no active/draft bolts |
| 1 | **Celebrate!** | All bolts complete AND all intents complete |

**Selection Algorithm:**
```
1. Check for active bolt → suggest "Continue" (priority 1)
2. Check for unblocked drafts without active bolt → suggest "Start" (priority 1)
3. If active bolt has currentStage → suggest "Complete Stage" (priority 2)
4. Find blocking bolt with max unblock impact → suggest "Unblock" (priority 3)
5. Find intents with orphan stories → suggest "Create Bolt" (priority 4)
6. If everything complete → suggest "Celebrate" (priority 1)
```

#### Current Intent Selection

The "current intent" shown in the header uses a priority cascade:

| Priority | Strategy | Description |
|----------|----------|-------------|
| 1 | **Active Bolt** | Intent containing a bolt with `status: in-progress` |
| 2 | **Recent Activity** | Intent with most recent bolt timestamp (completed > started > created) |
| 3 | **In-Progress Stories** | Intent with most stories having `status: in-progress` |
| 4 | **Incomplete Work** | First intent with `status: in-progress` or `status: draft` |
| 5 | **Fallback** | First intent in list |

---

## Bolt Status Lifecycle

```
draft → in-progress → complete
         ↓
       blocked (if requires_bolts incomplete)
```

**Frontmatter Fields Used:**
```yaml
status: draft | in-progress | complete
current_stage: "implement"  # Active stage name
stages_completed:
  - name: spec
    completed: 2025-01-15T10:30:00Z
requires_bolts:
  - bolt-dependency-1
enables_bolts:
  - bolt-dependent-1
created: 2025-01-14T09:00:00Z
started: 2025-01-15T08:00:00Z
completed: 2025-01-16T17:00:00Z
```

---

## Tab Selection

Tabs persist across VS Code sessions. The extension saves your active tab choice to workspace state.

**Keyboard:** Not currently supported
**Mouse:** Click tab headers (Bolts, Specs, Overview) to switch views

---

## Architecture

The extension uses a hybrid rendering approach:
- **Bolts view**: Lit web components with reactive data binding
- **Specs/Overview views**: Server-rendered HTML with event delegation

This allows for rich interactivity in the Bolts view while keeping Specs/Overview lightweight.

### State Flow

```
File Watcher → Parser → StateStore → Selectors → WebviewProvider → Webview
                              ↓
                       [Computed State]
                              ↓
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
currentIntent            activeBolts              activityFeed
pendingBolts            completedBolts            nextActions
boltStats               overallProgress
```

---

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript and bundle webview
npm run compile

# Watch for changes
npm run watch

# Run tests
npm test
```

## File Structure

```
src/
├── sidebar/           # Extension host code
│   ├── webviewProvider.ts   # Main provider
│   └── webviewMessaging.ts  # Message types
├── webview/           # Webview UI code
│   ├── components/    # Lit components
│   │   ├── app.ts     # Root component
│   │   ├── tabs/      # Tab navigation
│   │   └── bolts/     # Bolts view components
│   ├── html.ts        # Server-rendered HTML generators
│   └── styles.ts      # CSS styles
├── parser/            # Memory bank parsing
│   ├── artifactParser.ts    # Parse intents/units/stories/bolts
│   ├── activityFeed.ts      # Derive activity events
│   └── dependencyComputation.ts  # Compute bolt dependencies
└── state/             # Centralized state management
    ├── stateStore.ts  # State container
    ├── selectors.ts   # Computed state derivation
    └── types.ts       # Type definitions
```

---

## Publishing (Maintainers)

The extension is automatically published to the VS Code Marketplace when changes are merged to `main`.

### Setup VSCE_PAT Secret

To enable automated publishing, configure the `VSCE_PAT` secret:

1. **Create Azure DevOps Organization** (if needed)
   - Go to https://dev.azure.com
   - Sign in with your Microsoft account
   - Create a new organization if you don't have one

2. **Create Personal Access Token**
   - Click your profile icon (top right) → "Personal access tokens"
   - Click "+ New Token"
   - Configure:
     - **Name**: `vscode-marketplace`
     - **Organization**: Select **"All accessible organizations"** (required for CLI publishing)
     - **Expiration**: Set as needed (max 1 year)
     - **Scopes**: Click "Show all scopes" → scroll to "Marketplace" → check **"Manage"**
   - Click "Create" and **copy the token immediately**

3. **Create Publisher** (if needed)
   - Go to https://marketplace.visualstudio.com/manage
   - Sign in with the same Microsoft account
   - Create publisher with ID `specsmd`

4. **Add Secret to GitHub**
   - Go to repository Settings → Secrets → Actions
   - Click "New repository secret"
   - Name: `VSCE_PAT`
   - Value: Paste your token
