# Unit Brief: Claude Code Installer

## Overview

The Claude Code Installer handles installation of specsmd to Claude Code, including both slash commands (`.claude/commands/`) and agents (`.claude/agents/`).

---

## Scope

### In Scope

- Claude Code detection
- Command file installation to `.claude/commands/`
- Agent file installation to `.claude/agents/`
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
└── commands/              ← Serves as both commands and agents
    ├── master-agent.md
    ├── inception-agent.md
    ├── construction-agent.md
    └── operations-agent.md
```

### Target Installation Paths

```text
project-root/
└── .claude/
    ├── commands/                              ← Slash commands
    │   ├── specsmd-master-agent.md            → /specsmd-master-agent
    │   ├── specsmd-inception-agent.md
    │   ├── specsmd-construction-agent.md
    │   └── specsmd-operations-agent.md
    │
    └── agents/                                ← Agents
        ├── specsmd-master-agent.md
        ├── specsmd-inception-agent.md
        ├── specsmd-construction-agent.md
        └── specsmd-operations-agent.md
```

---

## Implementation Details

### ClaudeInstaller Class

Extends `ToolInstaller` and overrides `installCommands()` to also install agents.

### Properties

| Property | Value | Description |
|----------|-------|-------------|
| `key` | `'claude'` | Unique identifier for factory lookup |
| `name` | `'Claude Code'` | Display name in CLI |
| `commandsDir` | `'.claude/commands'` | Where to install command files |
| `agentsDir` | `'.claude/agents'` | Where to install agent files |
| `detectPath` | `'.claude'` | Directory to check for detection |

### Detection Logic

Claude Code is detected if `.claude/` directory exists in the project root.

### Installation Process

1. Install commands to `.claude/commands/` (via parent class)
2. Install agents to `.claude/agents/` (uses commands folder as source)

### Implementation

```javascript
const ToolInstaller = require('./ToolInstaller');
const fs = require('fs-extra');
const path = require('path');

class ClaudeInstaller extends ToolInstaller {
    get key() { return 'claude'; }
    get name() { return 'Claude Code'; }
    get commandsDir() { return '.claude/commands'; }
    get agentsDir() { return '.claude/agents'; }
    get detectPath() { return '.claude'; }

    async installCommands(flowPath, config) {
        // Install commands (default behavior)
        const installedCommands = await super.installCommands(flowPath, config);
        // Install agents (from commands folder)
        const installedAgents = await this.installAgents(flowPath, config);
        return [...installedCommands, ...installedAgents];
    }

    async installAgents(flowPath, config) {
        await fs.ensureDir(this.agentsDir);
        const commandsSourceDir = path.join(flowPath, 'commands');

        if (!await fs.pathExists(commandsSourceDir)) return [];

        const agentFiles = await fs.readdir(commandsSourceDir);
        const installedFiles = [];

        for (const agentFile of agentFiles) {
            if (agentFile.endsWith('.md')) {
                const sourcePath = path.join(commandsSourceDir, agentFile);
                const prefix = config?.command?.prefix ? `${config.command.prefix}-` : '';
                const targetFileName = `specsmd-${prefix}${agentFile}`;
                const targetPath = path.join(this.agentsDir, targetFileName);
                await fs.copy(sourcePath, targetPath);
                installedFiles.push(targetFileName);
            }
        }
        return installedFiles;
    }
}
```

---

## Commands vs Agents

| Feature | Commands | Agents |
|---------|----------|--------|
| Location | `.claude/commands/` | `.claude/agents/` |
| Invocation | `/specsmd-master-agent` | Natural language or explicit |
| Context | Shared with main conversation | Isolated context window |
| Parallelism | Sequential | Up to 10 concurrent |
| Source | `commands/` folder | `commands/` folder |

Both commands and agents are sourced from the same `commands/` folder, with the same content installed to both directories.

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

### AC-3: Agent Installation

- GIVEN user selects Claude Code
- WHEN installation completes
- THEN `.claude/agents/specsmd-*.md` files exist
- AND files contain agent activation content
- AND files reference full agents in `.specsmd/aidlc/agents/`

### AC-4: Non-Detection

- GIVEN a project without `.claude/` directory
- WHEN detectTools() runs
- THEN Claude Code is NOT listed as detected
- BUT user can still select it manually
