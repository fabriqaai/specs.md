# Unit Brief: OpenCode Installer

## Overview

The OpenCode Installer handles installation of specsmd agents into OpenCode's `.opencode/` directory.

---

## Scope

### In Scope

- OpenCode detection
- Agent file installation to `.opencode/`

### Out of Scope

- Base installation logic (handled by ToolInstaller)
- Other tool installations

---

## Technical Context

### File Structure

```text
src/lib/installers/
└── OpenCodeInstaller.js
```

### Target Installation Path

```text
project-root/
└── .opencode/
    ├── specsmd-master-agent.md
    ├── specsmd-inception-agent.md
    ├── specsmd-construction-agent.md
    └── specsmd-operations-agent.md
```

---

## Implementation Details

### OpenCodeInstaller Class

Extends `ToolInstaller` with standard behavior.

### Properties

| Property | Value | Description |
|----------|-------|-------------|
| `key` | `'opencode'` | Unique identifier for factory lookup |
| `name` | `'OpenCode'` | Display name in CLI |
| `commandsDir` | `'.opencode'` | Where to install agent files |
| `detectPath` | `'.opencode'` | Directory to check for detection |

### Detection Logic

OpenCode is detected if `.opencode/` directory exists in the project root.

---

## OpenCode Reference

OpenCode is an open-source AI coding assistant.

### Key Features

- Open-source implementation
- Multiple AI model support
- Agent and command separation
- Extensible architecture

### Configuration Locations

| Type | Location |
|------|----------|
| Agents | `.opencode/agent/` |
| Commands | `.opencode/command/` |
| Project config | `.opencode/` |

---

## Acceptance Criteria

### AC-1: Detection

- GIVEN a project with `.opencode/` directory
- WHEN detectTools() runs
- THEN OpenCode is listed as detected

### AC-2: Installation

- GIVEN user selects OpenCode
- WHEN installation completes
- THEN `.opencode/specsmd-*.md` files exist
- AND files contain agent definitions

### AC-3: Non-Detection

- GIVEN a project without `.opencode/` directory
- WHEN detectTools() runs
- THEN OpenCode is NOT listed as detected
- BUT user can still select it manually
