# Unit Brief: Gemini CLI Installer

## Overview

The Gemini CLI Installer handles installation of specsmd agents into Gemini CLI's `.gemini/` directory.

---

## Scope

### In Scope

- Gemini CLI detection
- Agent file installation to `.gemini/`

### Out of Scope

- Base installation logic (handled by ToolInstaller)
- Other tool installations

---

## Technical Context

### File Structure

```text
src/lib/installers/
└── GeminiInstaller.js
```

### Target Installation Path

```text
project-root/
└── .gemini/
    ├── specsmd-master-agent.md
    ├── specsmd-inception-agent.md
    ├── specsmd-construction-agent.md
    └── specsmd-operations-agent.md
```

---

## Implementation Details

### GeminiInstaller Class

Extends `ToolInstaller` with standard behavior.

### Properties

| Property | Value | Description |
|----------|-------|-------------|
| `key` | `'gemini'` | Unique identifier for factory lookup |
| `name` | `'Gemini CLI'` | Display name in CLI |
| `commandsDir` | `'.gemini'` | Where to install agent files |
| `detectPath` | `'.gemini'` | Directory to check for detection |

### Detection Logic

Gemini CLI is detected if `.gemini/` directory exists in the project root.

---

## Gemini CLI Reference

Gemini CLI is Google's command-line interface for Gemini AI models.

### Key Features

- Terminal-based AI assistance
- Code generation and editing
- Multi-turn conversations
- File context awareness

### Configuration Locations

| Type | Location |
|------|----------|
| Project config | `.gemini/` |
| Commands | `.gemini/commands/` |
| Global config | `~/.gemini/` |

---

## Acceptance Criteria

### AC-1: Detection

- GIVEN a project with `.gemini/` directory
- WHEN detectTools() runs
- THEN Gemini CLI is listed as detected

### AC-2: Installation

- GIVEN user selects Gemini CLI
- WHEN installation completes
- THEN `.gemini/specsmd-*.md` files exist
- AND files contain agent definitions

### AC-3: Non-Detection

- GIVEN a project without `.gemini/` directory
- WHEN detectTools() runs
- THEN Gemini CLI is NOT listed as detected
- BUT user can still select it manually
