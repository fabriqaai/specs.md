# Unit Brief: Cline Installer

## Overview

The Cline Installer handles installation of specsmd agents into Cline's `.clinerules/` directory.

---

## Scope

### In Scope

- Cline detection
- Agent file installation to `.clinerules/`

### Out of Scope

- Base installation logic (handled by ToolInstaller)
- Other tool installations

---

## Technical Context

### File Structure

```text
src/lib/installers/
└── ClineInstaller.js
```

### Target Installation Path

```text
project-root/
└── .clinerules/
    ├── specsmd-master-agent.md
    ├── specsmd-inception-agent.md
    ├── specsmd-construction-agent.md
    └── specsmd-operations-agent.md
```

---

## Implementation Details

### ClineInstaller Class

Extends `ToolInstaller` with standard behavior.

### Properties

| Property | Value | Description |
|----------|-------|-------------|
| `key` | `'cline'` | Unique identifier for factory lookup |
| `name` | `'Cline'` | Display name in CLI |
| `commandsDir` | `'.clinerules'` | Where to install agent files |
| `detectPath` | `'.clinerules'` | Directory to check for detection |

### Detection Logic

Cline is detected if `.clinerules/` directory exists in the project root.

---

## Cline Reference

Cline (formerly Claude Dev) is a VS Code extension for AI-assisted development.

### Key Features

- Autonomous coding agent
- File creation and editing
- Terminal command execution
- Browser automation

### Configuration Locations

| Type | Location |
|------|----------|
| Project rules | `.clinerules/` |
| Workflows | `.clinerules/workflows/` |

---

## Acceptance Criteria

### AC-1: Detection

- GIVEN a project with `.clinerules/` directory
- WHEN detectTools() runs
- THEN Cline is listed as detected

### AC-2: Installation

- GIVEN user selects Cline
- WHEN installation completes
- THEN `.clinerules/specsmd-*.md` files exist
- AND files contain agent definitions

### AC-3: Non-Detection

- GIVEN a project without `.clinerules/` directory
- WHEN detectTools() runs
- THEN Cline is NOT listed as detected
- BUT user can still select it manually
