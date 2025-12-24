# Unit Brief: Cursor Installer

## Overview

The Cursor Installer handles installation of specsmd agents into Cursor's `.cursor/commands/` directory using standard Markdown format.

---

## Scope

### In Scope
- Cursor detection
- Command file installation to `.cursor/commands/`
- Standard Markdown format (`.md` files)

### Out of Scope
- Base installation logic (handled by ToolInstaller)
- Other tool installations

---

## Technical Context

### File Structure
```
src/lib/installers/
└── CursorInstaller.js
```

### Target Installation Path
```
project-root/
└── .cursor/
    └── commands/
        ├── specsmd-master-agent.md
        ├── specsmd-inception-agent.md
        ├── specsmd-construction-agent.md
        └── specsmd-operations-agent.md
```

---

## Implementation Details

### CursorInstaller Class

Extends `ToolInstaller` and overrides `installCommands()` to install commands as `.md` files.

### Properties

| Property | Value | Description |
|----------|-------|-------------|
| `key` | `'cursor'` | Unique identifier for factory lookup |
| `name` | `'Cursor'` | Display name in CLI |
| `commandsDir` | `'.cursor/commands'` | Where to install command files |
| `detectPath` | `'.cursor'` | Directory to check for detection |

### File Format

**Source file** (`master-agent.md`):
```markdown
# Master Agent
...content...
```

**Installed file** (`specsmd-master-agent.md`):
```markdown
# Master Agent
...content...
```

### Key Transformations
1. **Prefix**: Adds `specsmd-` prefix to filename
2. **Extension**: Keeps `.md` extension

### Detection Logic
Cursor is detected if `.cursor/` directory exists in the project root.

---

## Cursor Commands Reference

Per Cursor documentation:

- **Project Commands**: Stored in `.cursor/commands/` directory
- **File Format**: Standard Markdown with `.md` extension
- **Invocation**: Commands are invoked via slash commands in Cursor

---

## Acceptance Criteria

### AC-1: Detection
- GIVEN a project with `.cursor/` directory
- WHEN detectTools() runs
- THEN Cursor is listed as detected

### AC-2: Installation
- GIVEN user selects Cursor
- WHEN installation completes
- THEN `.cursor/commands/specsmd-*.md` files exist
- AND files contain agent definitions

### AC-3: Non-Detection
- GIVEN a project without `.cursor/` directory
- WHEN detectTools() runs
- THEN Cursor is NOT listed as detected
- BUT user can still select it manually
