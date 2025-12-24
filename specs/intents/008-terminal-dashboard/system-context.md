# System Context: Terminal Dashboard

## Boundaries

### In Scope
- Terminal UI rendering and layout
- Project state detection and reading
- Memory bank file parsing
- Interactive navigation
- Multiple output formats (interactive, JSON, compact)

### Out of Scope
- Modifying project state (read-only dashboard)
- Remote data fetching (local files only)
- Agent execution (just displays state)
- Installation of flows (separate installer concern)

---

## Actors

### Primary Actors

#### AI-Native Engineer (End User)
- Runs dashboard to understand project state
- Navigates between sections to find information
- Uses JSON output for scripting/automation

#### CI/CD Pipeline
- Uses `--json` output for automated checks
- Validates project state before deployments

### System Actors

#### File System
- Provides manifest, memory bank, and project files
- Source of truth for all dashboard data

---

## External Systems

### Local File System
- **Interface**: Node.js `fs` module
- **Data Exchange**: Read manifest.yaml, memory-bank files, intent/unit/story files
- **Dependency**: Required - dashboard is read-only viewer

### Terminal Emulator
- **Interface**: stdout/stdin
- **Data Exchange**: Render UI, receive keyboard input
- **Dependency**: Required - user interaction channel

---

## Integration Points

### Dashboard ↔ File System
```
Dashboard starts
  → Check for .specsmd/manifest.yaml
  → Parse manifest for flow/tools
  → Scan memory-bank/ directory
  → Count intents, units, stories
  → Find active bolt
  → Render dashboard
```

### Dashboard ↔ User
```
User presses key
  → Dashboard handles input
  → Updates view if navigation key
  → Exits if quit key
```

---

## Context Diagram

```
                    ┌─────────────────────┐
                    │   AI-Native Engineer │
                    └──────────┬──────────┘
                               │ runs npx command
                               ▼
                    ┌──────────────────────┐
                    │   Terminal Dashboard  │
                    │                       │
                    │  ┌─────────────────┐  │
                    │  │ Project Detect  │  │
                    │  ├─────────────────┤  │
                    │  │ State Scanner   │  │
                    │  ├─────────────────┤  │
                    │  │ UI Renderer     │  │
                    │  ├─────────────────┤  │
                    │  │ Input Handler   │  │
                    │  └─────────────────┘  │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  .specsmd/      │  │  memory-bank/   │  │  Terminal       │
│  manifest.yaml  │  │                 │  │  (stdout/stdin) │
│                 │  │  intents/       │  │                 │
│  - flow         │  │  bolts/         │  │  - render UI    │
│  - tools        │  │  standards/     │  │  - keyboard in  │
│  - version      │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Data Flow

### Interactive Mode
```
1. User runs: npx @specs.md/specsmd
2. CLI checks for .specsmd/manifest.yaml
3. If not found: show "Not a specsmd project" message and exit
4. If found: parse manifest
5. Scan memory-bank/ for intents, units, stories
6. Scan bolts/ for bolt status
7. Check standards/ for defined standards
8. Render initial dashboard view
9. Enter input loop:
   - Wait for keypress
   - Handle navigation (i, b, s keys)
   - Handle quit (q, Ctrl+C)
10. On quit: clear screen, exit cleanly
```

### JSON Mode
```
1. User runs: npx @specs.md/specsmd --json
2. Perform same scanning as interactive mode
3. Build JSON object with all data
4. Output JSON to stdout
5. Exit immediately (no input loop)
```

---

## Constraints

### Technical Constraints
- Must work in terminals without Unicode support (ASCII fallback)
- Must handle narrow terminals (min 80 columns)
- Must work without color support
- Memory scanning must be efficient for large projects

### Platform Constraints
- Must work on macOS, Linux, Windows
- Must handle different path separators
- Must handle case-sensitive and case-insensitive file systems

### Performance Constraints
- Initial render under 500ms
- Memory under 50MB
- Responsive to keyboard input (<100ms)

---

## Quality Attributes

### Usability
- Clear visual hierarchy
- Obvious navigation affordances
- Helpful empty states
- Consistent key bindings

### Reliability
- Never crash on malformed files
- Graceful handling of missing data
- Clean exit on interrupt signals

### Performance
- Fast initial load
- Lazy loading for deep data
- Efficient file scanning
