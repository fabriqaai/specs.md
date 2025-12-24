# Unit Brief: GitHub Copilot Installer

## Overview

The GitHub Copilot Installer handles installation of specsmd prompts and agents into GitHub Copilot's `.github/` directory structure.

---

## Scope

### In Scope

- GitHub Copilot detection
- Prompt file installation to `.github/prompts/` (with `.prompt.md` format)
- Agent file installation to `.github/agents/` (with `.agent.md` format)

### Out of Scope

- Base installation logic (handled by ToolInstaller)
- Other tool installations

---

## Technical Context

### File Structure

```
src/lib/installers/
└── CopilotInstaller.js
```

### Target Installation Paths

```
project-root/
└── .github/
    ├── prompts/
    │   ├── specsmd-master-agent.prompt.md
    │   ├── specsmd-inception-agent.prompt.md
    │   ├── specsmd-construction-agent.prompt.md
    │   └── specsmd-operations-agent.prompt.md
    └── agents/
        ├── specsmd-master-agent.agent.md
        ├── specsmd-inception-agent.agent.md
        ├── specsmd-construction-agent.agent.md
        └── specsmd-operations-agent.agent.md
```

---

## Implementation Details

### CopilotInstaller Class

Extends `ToolInstaller` and overrides `installCommands()` to install both prompts and agents.

### Properties

| Property | Value | Description |
|----------|-------|-------------|
| `key` | `'copilot'` | Unique identifier for factory lookup |
| `name` | `'GitHub Copilot'` | Display name in CLI |
| `commandsDir` | `'.github/prompts'` | Where to install prompt files |
| `agentsDir` | `'.github/agents'` | Where to install agent files |
| `detectPath` | `'.github'` | Directory to check for detection |

### Installation Process

1. **Prompts**: Install from `commands/` to `.github/prompts/`
   - Transform `.md` → `.prompt.md`
   - Add `specsmd-` prefix

2. **Agents**: Install from `commands/` to `.github/agents/`
   - Transform `.md` → `.agent.md`
   - Add `specsmd-` prefix
   - Same source files serve as both prompts and agents

### File Naming Transformations

**Prompts** (from `commands/`):

| Source File | Installed File |
|-------------|----------------|
| `master-agent.md` | `specsmd-master-agent.prompt.md` |
| `inception-agent.md` | `specsmd-inception-agent.prompt.md` |

**Agents** (from `commands/`):

| Source File | Installed File |
|-------------|----------------|
| `master-agent.md` | `specsmd-master-agent.agent.md` |
| `inception-agent.md` | `specsmd-inception-agent.agent.md` |

### Detection Logic

GitHub Copilot is detected if `.github/` directory exists.

---

## Prompts vs Agents

| Feature | Prompts | Agents |
|---------|---------|--------|
| Location | `.github/prompts/` | `.github/agents/` |
| Extension | `.prompt.md` | `.agent.md` |
| Source | `commands/` folder | `commands/` folder |
| Purpose | Reusable prompt templates | Copilot workspace agents |

---

## Acceptance Criteria

### AC-1: Detection

- GIVEN a project with `.github/` directory
- WHEN detectTools() runs
- THEN GitHub Copilot is listed as detected

### AC-2: Prompt Installation

- GIVEN user selects GitHub Copilot
- WHEN installation completes
- THEN `.github/prompts/specsmd-*.prompt.md` files exist
- AND files contain prompt definitions

### AC-3: Agent Installation

- GIVEN user selects GitHub Copilot
- WHEN installation completes
- THEN `.github/agents/specsmd-*.agent.md` files exist
- AND files contain agent definitions

### AC-4: File Naming

- GIVEN a command file `master-agent.md`
- WHEN installed to Copilot
- THEN the prompt file is named `specsmd-master-agent.prompt.md`
- AND the agent file is named `specsmd-master-agent.agent.md`
