# Unit Brief: Google Antigravity Installer

## Overview

The Google Antigravity Installer handles installation of specsmd agents into Antigravity's `.agent/agents/` directory.

---

## Scope

### In Scope
- Google Antigravity detection
- Agent file installation to `.agent/agents/`

### Out of Scope
- Base installation logic (handled by ToolInstaller)
- Other tool installations

---

## Technical Context

### File Structure
```
src/lib/installers/
└── AntigravityInstaller.js
```

### Target Installation Path
```
project-root/
└── .agent/
    └── agents/
        ├── specsmd-master-agent.md
        ├── specsmd-inception-agent.md
        ├── specsmd-construction-agent.md
        └── specsmd-operations-agent.md
```

---

## Implementation Details

### AntigravityInstaller Class

Extends `ToolInstaller` with standard behavior (no custom transformations needed).

```javascript
const ToolInstaller = require('./ToolInstaller');

class AntigravityInstaller extends ToolInstaller {
    get key() {
        return 'antigravity';
    }

    get name() {
        return 'Google Antigravity';
    }

    get commandsDir() {
        return '.agent/agents';
    }

    get detectPath() {
        return '.agent';
    }
}

module.exports = AntigravityInstaller;
```

### Properties

| Property | Value | Description |
|----------|-------|-------------|
| `key` | `'antigravity'` | Unique identifier for factory lookup |
| `name` | `'Google Antigravity'` | Display name in CLI |
| `commandsDir` | `'.agent/agents'` | Where to install agent files |
| `detectPath` | `'.agent'` | Directory to check for detection |

### Detection Logic
Google Antigravity is detected if `.agent/` directory exists in the project root. This directory is created when Antigravity initializes a workspace.

### Command Installation
Inherits `installCommands()` from `ToolInstaller`:
1. Creates `.agent/agents/` if it doesn't exist
2. Copies all `.md` files from `src/flows/{flow}/commands/`
3. Prefixes each file with `specsmd-`

---

## Google Antigravity Reference

Google Antigravity is an agentic development platform launched by Google in November 2025.

### Directory Structure
```
.agent/
├── agents/        # Agent definitions
├── rules/         # Project-level rules
└── workflows/     # Automation workflows
```

### Key Concepts
- **Agents**: Markdown files that define AI agent behavior
- **Rules**: Guidelines that agents follow during code generation
- **Workflows**: Multi-step automation sequences

### Configuration Locations
| Type | Location |
|------|----------|
| Project agents | `.agent/agents/` |
| Project rules | `.agent/rules/` |
| Project workflows | `.agent/workflows/` |
| Global config | `~/.gemini/antigravity/` |

---

## Acceptance Criteria

### AC-1: Detection
- GIVEN a project with `.agent/` directory
- WHEN detectTools() runs
- THEN Google Antigravity is listed as detected

### AC-2: Installation
- GIVEN user selects Google Antigravity
- WHEN installation completes
- THEN `.agent/agents/specsmd-*.md` files exist
- AND files contain agent definitions

### AC-3: Non-Detection
- GIVEN a project without `.agent/` directory
- WHEN detectTools() runs
- THEN Google Antigravity is NOT listed as detected
- BUT user can still select it manually

### AC-4: No Conflicts
- GIVEN `.agent/` directory exists for other purposes
- WHEN specsmd installs to `.agent/agents/`
- THEN existing files in `.agent/` are not modified
- AND only `specsmd-` prefixed files are created
