# Unit Brief: Codex Installer

## Overview

The Codex Installer handles installation of specsmd agents into OpenAI Codex's `.codex/` directory.

---

## Scope

### In Scope

- Codex detection
- Agent file installation to `.codex/`

### Out of Scope

- Base installation logic (handled by ToolInstaller)
- Other tool installations

---

## Technical Context

### File Structure

```text
src/lib/installers/
└── CodexInstaller.js
```

### Target Installation Path

```text
project-root/
└── .codex/
    ├── specsmd-master-agent.md
    ├── specsmd-inception-agent.md
    ├── specsmd-construction-agent.md
    └── specsmd-operations-agent.md
```

---

## Implementation Details

### CodexInstaller Class

Extends `ToolInstaller` with standard behavior.

### Properties

| Property | Value | Description |
|----------|-------|-------------|
| `key` | `'codex'` | Unique identifier for factory lookup |
| `name` | `'Codex'` | Display name in CLI |
| `commandsDir` | `'.codex'` | Where to install agent files |
| `detectPath` | `'.codex'` | Directory to check for detection |

### Detection Logic

Codex is detected if `.codex/` directory exists in the project root.

---

## Codex Reference

OpenAI Codex is a code-focused AI model and CLI tool.

### Key Features

- Code completion and generation
- Natural language to code
- Multi-language support
- Context-aware assistance

### Configuration Locations

| Type | Location |
|------|----------|
| Project prompts | `.codex/` |
| Global prompts | `~/.codex/prompts/` |

---

## Acceptance Criteria

### AC-1: Detection

- GIVEN a project with `.codex/` directory
- WHEN detectTools() runs
- THEN Codex is listed as detected

### AC-2: Installation

- GIVEN user selects Codex
- WHEN installation completes
- THEN `.codex/specsmd-*.md` files exist
- AND files contain agent definitions

### AC-3: Non-Detection

- GIVEN a project without `.codex/` directory
- WHEN detectTools() runs
- THEN Codex is NOT listed as detected
- BUT user can still select it manually
