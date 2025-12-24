# Unit Brief: Kiro CLI Installer

## Overview

The Kiro CLI Installer handles installation of specsmd agents into Kiro's `.kiro/steering/` directory.

---

## Scope

### In Scope

- Kiro CLI detection
- Agent file installation to `.kiro/steering/`

### Out of Scope

- Base installation logic (handled by ToolInstaller)
- Other tool installations

---

## Technical Context

### File Structure

```text
src/lib/installers/
└── KiroInstaller.js
```

### Target Installation Path

```text
project-root/
└── .kiro/
    └── steering/
        ├── specsmd-master-agent.md
        ├── specsmd-inception-agent.md
        ├── specsmd-construction-agent.md
        └── specsmd-operations-agent.md
```

---

## Implementation Details

### KiroInstaller Class

Extends `ToolInstaller` with standard behavior.

### Properties

| Property | Value | Description |
|----------|-------|-------------|
| `key` | `'kiro'` | Unique identifier for factory lookup |
| `name` | `'Kiro CLI'` | Display name in CLI |
| `commandsDir` | `'.kiro/steering'` | Where to install steering files |
| `detectPath` | `'.kiro'` | Directory to check for detection |

### Detection Logic

Kiro CLI is detected if `.kiro/` directory exists in the project root.

---

## Kiro CLI Reference

Kiro is AWS's agentic AI IDE and CLI for spec-driven development.

### Key Features

- Spec-driven development
- Steering files for requirements
- Hooks for automation
- AWS integration

### Configuration Locations

| Type | Location |
|------|----------|
| Agents | `.kiro/steering/` (specsmd installs here) |
| Specs | `.kiro/specs/` |
| Steering | `.kiro/steering/` |

---

## Acceptance Criteria

### AC-1: Detection

- GIVEN a project with `.kiro/` directory
- WHEN detectTools() runs
- THEN Kiro CLI is listed as detected

### AC-2: Installation

- GIVEN user selects Kiro CLI
- WHEN installation completes
- THEN `.kiro/steering/specsmd-*.md` files exist
- AND files contain agent definitions

### AC-3: Non-Detection

- GIVEN a project without `.kiro/` directory
- WHEN detectTools() runs
- THEN Kiro CLI is NOT listed as detected
- BUT user can still select it manually
