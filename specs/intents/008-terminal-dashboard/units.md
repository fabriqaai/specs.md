# Units: Terminal Dashboard

## Unit Breakdown

| Unit | Description | Priority | Dependencies |
|------|-------------|----------|--------------|
| **project-scanner** | Detects and reads specsmd project state | High | None |
| **dashboard-renderer** | Renders terminal UI using Ink | High | project-scanner |
| **navigation-handler** | Handles keyboard input and navigation | Medium | dashboard-renderer |
| **output-formatter** | Provides JSON and compact output modes | Medium | project-scanner |

---

## Unit 1: project-scanner

### Responsibility
Detect specsmd project, read manifest, and scan memory bank to build a complete project state object.

### Stories
1. As a dashboard, I need to detect if cwd has `.specsmd/manifest.yaml`
2. As a dashboard, I need to parse manifest for flow, version, and tools
3. As a dashboard, I need to count intents in `memory-bank/intents/`
4. As a dashboard, I need to count units per intent
5. As a dashboard, I need to count stories per unit
6. As a dashboard, I need to find and parse active bolt (if any)
7. As a dashboard, I need to list all bolts with their status
8. As a dashboard, I need to detect defined standards
9. As a dashboard, I need to handle missing/malformed files gracefully

### Key Interfaces
```typescript
interface ProjectScanner {
  isValidProject(dir: string): Promise<boolean>;
  scanProject(dir: string): Promise<ProjectState>;
}

interface ProjectState {
  isValid: boolean;
  manifest: {
    flow: string;
    version: string;
    tools: string[];
    installedAt: string;
  } | null;
  memoryBank: {
    intents: IntentSummary[];
    totalUnits: number;
    totalStories: number;
  };
  bolts: {
    total: number;
    active: BoltSummary | null;
    byStatus: Record<BoltStatus, number>;
  };
  standards: {
    defined: boolean;
    categories: string[];
  };
}

interface IntentSummary {
  name: string;
  unitCount: number;
  storyCount: number;
  isActive: boolean;
}

interface BoltSummary {
  id: string;
  unit: string;
  status: BoltStatus;
  stage: number;
  totalStages: number;
  startedAt: string;
}

type BoltStatus = 'planned' | 'active' | 'completed' | 'failed';
```

### Acceptance Criteria
- Correctly detects valid specsmd projects
- Parses manifest without errors
- Counts all memory bank entities accurately
- Handles missing directories gracefully
- Returns null/empty values (not errors) for missing data

---

## Unit 2: dashboard-renderer

### Responsibility
Render the terminal dashboard UI using Ink (React for CLI). Display project state in a clear, visually appealing layout.

### Stories
1. As a dashboard, I need to render header with specs.md branding and version
2. As a dashboard, I need to render flow and tools information
3. As a dashboard, I need to render memory bank statistics panel
4. As a dashboard, I need to render active bolt panel (or "No active bolt")
5. As a dashboard, I need to render intent list with counts
6. As a dashboard, I need to render navigation footer with key hints
7. As a dashboard, I need to show helpful message if not a specsmd project
8. As a dashboard, I need to handle narrow terminal widths
9. As a dashboard, I need to support color themes (light/dark)
10. As a dashboard, I need to support ASCII-only mode

### Key Interfaces
```typescript
// React/Ink components
interface DashboardProps {
  state: ProjectState;
  onQuit: () => void;
}

interface HeaderProps {
  flow: string;
  version: string;
}

interface MemoryBankPanelProps {
  intents: number;
  units: number;
  stories: number;
  hasStandards: boolean;
}

interface ActiveBoltPanelProps {
  bolt: BoltSummary | null;
}

interface IntentListProps {
  intents: IntentSummary[];
}

interface FooterProps {
  keys: KeyHint[];
}
```

### Acceptance Criteria
- Dashboard renders without flicker
- Layout adapts to terminal width
- Colors are readable in both themes
- ASCII fallback works when Unicode unavailable
- Empty states are helpful, not confusing

---

## Unit 3: navigation-handler

### Responsibility
Handle keyboard input for interactive navigation between dashboard sections and views.

### Stories
1. As a user, I need to press `i` to focus on intents section
2. As a user, I need to press `b` to focus on bolts section
3. As a user, I need to press `s` to focus on standards section
4. As a user, I need to press `q` to quit the dashboard
5. As a user, I need to press `Ctrl+C` to quit the dashboard
6. As a user, I need to press `Enter` to drill down into selected item
7. As a user, I need to press `Esc` to go back to overview
8. As a user, I need arrow keys to navigate within a section

### Key Interfaces
```typescript
interface NavigationHandler {
  currentSection: 'overview' | 'intents' | 'bolts' | 'standards';
  selectedIndex: number;
  handleKey(key: Key): NavigationAction;
}

type NavigationAction =
  | { type: 'navigate'; section: string }
  | { type: 'select'; index: number }
  | { type: 'drilldown'; id: string }
  | { type: 'back' }
  | { type: 'quit' };
```

### Acceptance Criteria
- All documented keys work as expected
- Navigation state updates immediately
- Visual feedback on key press
- No input lag

---

## Unit 4: output-formatter

### Responsibility
Provide alternative output formats for non-interactive use cases (JSON, compact).

### Stories
1. As a user, I need `--json` to output project state as JSON
2. As a user, I need `--compact` to output minimal one-line summary
3. As a user, I need `--section=X` to output only a specific section
4. As a CI pipeline, I need JSON output for automated checks
5. As a script, I need non-zero exit code if not a specsmd project

### Key Interfaces
```typescript
interface OutputFormatter {
  formatJson(state: ProjectState): string;
  formatCompact(state: ProjectState): string;
  formatSection(state: ProjectState, section: string): string;
}

// Compact format example:
// "specsmd aidlc v0.2.55 | 4 intents, 12 units, 28 stories | bolt-auth-1 active"

// JSON format: full ProjectState object
```

### Acceptance Criteria
- JSON is valid and parseable
- Compact output fits in 80 columns
- Section filter works for all sections
- Exit code 1 if not a specsmd project

---

## Dependency Graph

```
┌─────────────────┐
│ project-scanner │ ← Scans project state
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────────────────┐  ┌──────────────────┐
│ dashboard-renderer│  │ output-formatter │
└────────┬──────────┘  └──────────────────┘
         │
         ▼
┌────────────────────┐
│ navigation-handler │
└────────────────────┘
```

---

## Implementation Priority

1. **Phase 1**: project-scanner + output-formatter (enable `--json` and `--compact` first)
2. **Phase 2**: dashboard-renderer (basic UI without navigation)
3. **Phase 3**: navigation-handler (full interactive experience)

---

## Technology Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| **CLI Framework** | Commander.js | Already used in specsmd |
| **Terminal UI** | Ink (React) | Modern, maintained, Flexbox layout |
| **YAML Parsing** | js-yaml | Already used in specsmd |
| **File System** | Node.js fs/promises | Built-in, async |
| **Testing** | Vitest + ink-testing-library | Unit + component tests |
