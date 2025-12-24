# Unit Brief: Roo Code Installer

## Overview

The Roo Code Installer handles installation of specsmd agents into Roo Code's `.roo/commands/` directory.

---

## Scope

### In Scope

- Roo Code detection
- Agent file installation to `.roo/commands/`

### Out of Scope

- Base installation logic (handled by ToolInstaller)
- Other tool installations

---

## Technical Context

### File Structure

```text
src/lib/installers/
└── RooInstaller.js
```

### Target Installation Path

```text
project-root/
└── .roo/
    └── commands/
        ├── specsmd-master-agent.md
        ├── specsmd-inception-agent.md
        ├── specsmd-construction-agent.md
        └── specsmd-operations-agent.md
```

---

## Implementation Details

### RooInstaller Class

Extends `ToolInstaller` with standard behavior.

### Properties

| Property | Value | Description |
|----------|-------|-------------|
| `key` | `'roo'` | Unique identifier for factory lookup |
| `name` | `'Roo Code'` | Display name in CLI |
| `commandsDir` | `'.roo/commands'` | Where to install agent files |
| `detectPath` | `'.roo'` | Directory to check for detection |

### Detection Logic

Roo Code is detected if `.roo/` directory exists in the project root.

---

## Roo Code Reference

Roo Code is an AI development assistant with multiple specialized modes.

### Key Features

- Multiple AI agent modes (Code, Architect, Debug, etc.)
- Custom mode creation
- Project-aware context

### Configuration Locations

| Type | Location |
|------|----------|
| Commands | `.roo/commands/` |
| Custom modes | `.roomodes` |
| Rules | `.roorules` |

---

## Acceptance Criteria

### AC-1: Detection

- GIVEN a project with `.roo/` directory
- WHEN detectTools() runs
- THEN Roo Code is listed as detected

### AC-2: Installation

- GIVEN user selects Roo Code
- WHEN installation completes
- THEN `.roo/commands/specsmd-*.md` files exist
- AND files contain agent definitions

### AC-3: Non-Detection

- GIVEN a project without `.roo/` directory
- WHEN detectTools() runs
- THEN Roo Code is NOT listed as detected
- BUT user can still select it manually
