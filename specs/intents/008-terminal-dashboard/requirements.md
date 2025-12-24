# Intent: Terminal Dashboard

## Overview

Provide a terminal-based dashboard accessible via `npx @specs.md/specsmd` that displays the current state of a specsmd project folder, including installed flows, memory bank status, active bolts, intent progress, and more.

---

## Research Summary

### Terminal UI Libraries Evaluated

| Library | Type | Pros | Cons | Recommendation |
|---------|------|------|------|----------------|
| **Ink** | React-based | Modern, familiar React patterns, TypeScript support, actively maintained | Requires React knowledge, Yoga layout engine | **Recommended** |
| **Blessed** | Curses-like | Feature-rich, extensive widgets, large ecosystem | Unmaintained, older API | Not recommended |
| **react-blessed** | React + Blessed | React DX with Blessed widgets | Depends on unmaintained Blessed | Not recommended |
| **Chalk + raw** | Manual | Minimal dependencies, full control | Complex layout management | For simple output only |

### Recommended Approach: Ink

Ink is the recommended choice because:
- React component model is familiar to most developers
- Flexbox layout via Yoga makes complex dashboards manageable
- Actively maintained with good TypeScript support
- Used by Shopify CLI, Blitz, and other production CLIs
- Easy to build interactive elements (navigation, input)

---

## Problem Statement

Currently, users have no quick way to understand the state of their specsmd project:
- What flow is installed?
- Which tools are configured?
- How many intents exist and their status?
- What bolts are active or completed?
- Is the memory bank properly initialized?

Users must manually inspect YAML files and folder structures to understand project state.

---

## Functional Requirements

### FR-1: Project Detection

- FR-1.1: System SHALL detect if current directory is a specsmd project (has `.specsmd/manifest.yaml`)
- FR-1.2: System SHALL display helpful message if not in a specsmd project
- FR-1.3: System SHALL read flow type and version from manifest
- FR-1.4: System SHALL detect configured tools from manifest

### FR-2: Memory Bank Status

- FR-2.1: System SHALL display memory bank initialization status
- FR-2.2: System SHALL count and display number of intents
- FR-2.3: System SHALL count and display number of units (across all intents)
- FR-2.4: System SHALL count and display number of stories
- FR-2.5: System SHALL display story-index mode (single-file, per-intent, etc.)

### FR-3: Intent Summary

- FR-3.1: System SHALL list all intents with their names and status
- FR-3.2: System SHALL indicate which intent is currently active (if any)
- FR-3.3: System SHALL show unit count per intent
- FR-3.4: System SHALL show story count per intent

### FR-4: Bolt Status

- FR-4.1: System SHALL count and display total bolts
- FR-4.2: System SHALL count bolts by status (planned, active, completed, failed)
- FR-4.3: System SHALL display currently active bolt (if any)
- FR-4.4: System SHALL show bolt stage progress for active bolt

### FR-5: Standards Status

- FR-5.1: System SHALL indicate if standards are defined
- FR-5.2: System SHALL list defined standard categories (tech-stack, architecture, etc.)

### FR-6: Interactive Navigation (Phase 2)

- FR-6.1: System SHALL support keyboard navigation between sections
- FR-6.2: System SHALL support drilling down into intent details
- FR-6.3: System SHALL support viewing bolt details
- FR-6.4: System SHALL support quick actions (e.g., start new bolt)

### FR-7: Quick Info Mode

- FR-7.1: System SHALL support `--json` flag for machine-readable output
- FR-7.2: System SHALL support `--compact` flag for minimal output
- FR-7.3: System SHALL exit cleanly on `q` or `Ctrl+C`

---

## Non-Functional Requirements

### NFR-1: Performance

- Dashboard SHALL render initial view in under 500ms
- File scanning SHALL be lazy/incremental where possible
- Memory usage SHALL stay under 50MB

### NFR-2: Compatibility

- Dashboard SHALL work on macOS, Linux, and Windows terminals
- Dashboard SHALL handle narrow terminal widths gracefully (min 80 columns)
- Dashboard SHALL use ASCII fallbacks when Unicode not supported

### NFR-3: User Experience

- Dashboard SHALL use colors consistent with specs.md branding
- Dashboard SHALL be readable in both light and dark terminal themes
- Dashboard SHALL provide clear visual hierarchy

### NFR-4: Accessibility

- Dashboard SHALL work without colors (via `--no-color` flag or `NO_COLOR` env)
- Dashboard SHALL be navigable via keyboard only

---

## Command Interface

```bash
# Main dashboard (interactive)
npx @specs.md/specsmd

# JSON output (for scripting)
npx @specs.md/specsmd --json

# Compact output (quick glance)
npx @specs.md/specsmd --compact

# Specific section only
npx @specs.md/specsmd --section=intents
npx @specs.md/specsmd --section=bolts
npx @specs.md/specsmd --section=standards
```

---

## Dashboard Layout (ASCII Mockup)

```
┌─────────────────────────────────────────────────────────────────┐
│  specs.md - Project Dashboard                          v0.2.55  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Flow: aidlc (AI Development Lifecycle)                         │
│  Tools: claude, cursor, copilot, antigravity, windsurf          │
│                                                                 │
├───────────────────────────┬─────────────────────────────────────┤
│  Memory Bank              │  Active Bolt                        │
│  ─────────────────────    │  ─────────────────────              │
│  Intents:     4           │  bolt-auth-service-1                │
│  Units:      12           │  Stage: 2/4 (Technical Design)      │
│  Stories:   28            │  Started: 2h ago                    │
│  Standards: yes           │  Unit: auth-service                 │
│                           │                                     │
├───────────────────────────┴─────────────────────────────────────┤
│  Intents                                                        │
│  ─────────────────────────────────────────────                  │
│  001-user-authentication     [3 units, 8 stories]  ▶ Active     │
│  002-product-catalog         [4 units, 10 stories]              │
│  003-shopping-cart           [3 units, 6 stories]               │
│  004-checkout-flow           [2 units, 4 stories]               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [i]ntents  [b]olts  [s]tandards  [q]uit                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Success Criteria

- Users can understand project state at a glance
- Dashboard loads in under 500ms
- Works across all major platforms
- Positive user feedback on usability

---

## Acceptance Criteria

### AC-1: Project Detection
- GIVEN a directory with `.specsmd/manifest.yaml`
- WHEN user runs `npx @specs.md/specsmd`
- THEN dashboard displays with project information

### AC-2: Non-Project Directory
- GIVEN a directory without `.specsmd/manifest.yaml`
- WHEN user runs `npx @specs.md/specsmd`
- THEN helpful message is shown with installation instructions

### AC-3: Memory Bank Stats
- GIVEN a project with 3 intents and 10 units
- WHEN dashboard loads
- THEN correct counts are displayed

### AC-4: Active Bolt Display
- GIVEN an active bolt in stage 2
- WHEN dashboard loads
- THEN active bolt section shows bolt name, stage, and progress

### AC-5: JSON Output
- GIVEN `--json` flag is passed
- WHEN dashboard runs
- THEN valid JSON is output to stdout (no interactive UI)

### AC-6: Graceful Exit
- GIVEN interactive dashboard is running
- WHEN user presses `q` or `Ctrl+C`
- THEN dashboard exits cleanly with no error
