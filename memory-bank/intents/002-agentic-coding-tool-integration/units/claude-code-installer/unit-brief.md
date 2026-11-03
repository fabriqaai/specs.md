# Unit Brief: Claude Code Installer

## Overview

The Claude Code Installer handles installation of specsmd to Claude Code as slash commands (`.claude/commands/`). It also removes the `.claude/agents/` copies that earlier versions installed.

---

## Scope

### In Scope

- Claude Code detection
- Command file installation to `.claude/commands/`
- Removal of legacy agent copies from `.claude/agents/`
- Claude Code specific configuration

### Out of Scope

- Base installation logic (handled by ToolInstaller)
- Other tool installations

---

## Technical Context

### File Structure

```text
src/lib/installers/
└── ClaudeInstaller.js
```

### Source Files

```text
src/flows/aidlc/
└── commands/              ← Installed as slash commands
    ├── master-agent.md
    ├── inception-agent.md
    ├── construction-agent.md
    └── operations-agent.md
```

### Target Installation Paths

```text
project-root/
└── .claude/
    └── commands/                              ← Slash commands
        ├── specsmd-master-agent.md            → /specsmd-master-agent
        ├── specsmd-inception-agent.md
        ├── specsmd-construction-agent.md
        └── specsmd-operations-agent.md
```

---

## Implementation Details

### ClaudeInstaller Class

Extends `ToolInstaller`. `installCommands()` installs commands via the parent class, then calls `removeLegacyFiles()`. Uninstall calls `removeLegacyFiles()` as well.

### Properties

| Property | Value | Description |
|----------|-------|-------------|
| `key` | `'claude'` | Unique identifier for factory lookup |
| `name` | `'Claude Code'` | Display name in CLI |
| `commandsDir` | `'.claude/commands'` | Where to install command files |
| `legacyAgentsDir` | `'.claude/agents'` | Where earlier versions copied the commands |
| `detectPath` | `'.claude'` | Directory to check for detection |

### Detection Logic

Claude Code is detected if `.claude/` directory exists in the project root.

### Installation Process

1. Install commands to `.claude/commands/` (via parent class)
2. Remove `.claude/agents/specsmd-<command>.md` files, where `<command>` is a command file of any flow. Other files in `.claude/agents/` are left alone.

---

## Why No Agents

Earlier versions copied each command file into `.claude/agents/` as well. That never worked:

- Claude Code subagents need `name:` frontmatter. The command files only have `description:`, so Claude Code skipped them.
- The command body is an activation prompt ("read and adopt the persona from..."), not a subagent definition.
- Subagents run in an isolated context and can't ask the user questions, while the flow agents stop at user checkpoints.

---

## Acceptance Criteria

### AC-1: Detection

- GIVEN a project with `.claude/` directory
- WHEN detectTools() runs
- THEN Claude Code is listed as detected

### AC-2: Command Installation

- GIVEN user selects Claude Code
- WHEN installation completes
- THEN `.claude/commands/specsmd-*.md` files exist
- AND files contain command definitions

### AC-3: No Agent Installation

- GIVEN user selects Claude Code
- WHEN installation completes
- THEN no files are written to `.claude/agents/`
- AND `specsmd-<command>.md` copies left there by earlier versions are removed
- AND other files in `.claude/agents/` are kept

### AC-4: Non-Detection

- GIVEN a project without `.claude/` directory
- WHEN detectTools() runs
- THEN Claude Code is NOT listed as detected
- BUT user can still select it manually

### AC-5: Uninstall

- GIVEN specsmd was installed for Claude Code
- WHEN uninstall runs
- THEN `.claude/commands/specsmd-*` files are removed
- AND `specsmd-<command>.md` copies in `.claude/agents/` are removed
