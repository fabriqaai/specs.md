# Unit Brief: Kilo Code Installer

## Overview

The Kilo Code Installer handles installation of specsmd agents into Kilo Code's `.kilo/` directory.

---

## Scope

### In Scope

- Kilo Code detection
- Agent file installation to `.kilo/`

### Out of Scope

- Base installation logic (handled by ToolInstaller)
- Other tool installations

---

## Technical Context

### File Structure

```text
src/lib/installers/
└── KiloInstaller.js
```

### Target Installation Path

```text
project-root/
└── .kilo/
    ├── specsmd-master-agent.md
    ├── specsmd-inception-agent.md
    ├── specsmd-construction-agent.md
    └── specsmd-operations-agent.md
```

---

## Implementation Details

### KiloInstaller Class

Extends `ToolInstaller` with standard behavior.

### Properties

| Property | Value | Description |
|----------|-------|-------------|
| `key` | `'kilo'` | Unique identifier for factory lookup |
| `name` | `'Kilo Code'` | Display name in CLI |
| `commandsDir` | `'.kilo'` | Where to install agent files |
| `detectPath` | `'.kilo'` | Directory to check for detection |

### Detection Logic

Kilo Code is detected if `.kilo/` directory exists in the project root.

---

## Kilo Code Reference

Kilo Code is an AI coding assistant with custom mode support.

### Key Features

- Multiple AI modes
- Custom mode creation
- Project-aware context
- Similar architecture to Roo Code

### Configuration Locations

| Type | Location |
|------|----------|
| Project config | `.kilo/` |
| Custom modes | `.kilocodemodes` |

---

## Acceptance Criteria

### AC-1: Detection

- GIVEN a project with `.kilo/` directory
- WHEN detectTools() runs
- THEN Kilo Code is listed as detected

### AC-2: Installation

- GIVEN user selects Kilo Code
- WHEN installation completes
- THEN `.kilo/specsmd-*.md` files exist
- AND files contain agent definitions

### AC-3: Non-Detection

- GIVEN a project without `.kilo/` directory
- WHEN detectTools() runs
- THEN Kilo Code is NOT listed as detected
- BUT user can still select it manually
