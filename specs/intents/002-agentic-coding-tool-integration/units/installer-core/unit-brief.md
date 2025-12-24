# Unit Brief: Installer Core

## Overview

The installer core provides the base framework for installing specsmd into agentic coding tools. It includes the abstract base class, factory pattern, CLI utilities, and constants.

---

## Scope

### In Scope
- Abstract `ToolInstaller` base class
- `InstallerFactory` for creating tool-specific installers
- `CLIUtils` for terminal UI (logo, boxes, colors, progress)
- Constants (theme colors, flow definitions)
- Main `installer.js` orchestration logic

### Out of Scope
- Tool-specific installation logic (handled by tool installers)

---

## Technical Context

### Entry Point
- `npx specsmd install` - Invokes CLI which calls `installer.js`

### File Structure
```
src/
├── bin/
│   └── cli.js                    # CLI entry point (Commander.js)
└── lib/
    ├── installer.js              # Main installation orchestration
    ├── InstallerFactory.js       # Factory for tool installers
    ├── cli-utils.js              # Terminal UI utilities
    ├── constants.js              # Theme colors, flow definitions
    └── installers/
        └── ToolInstaller.js      # Abstract base class
```

---

## Implementation Details

### 1. ToolInstaller Base Class (`installers/ToolInstaller.js`)

Abstract base class that all tool installers extend.

```javascript
const fs = require('fs-extra');
const path = require('path');

class ToolInstaller {
    constructor() {
        if (this.constructor === ToolInstaller) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    // Abstract properties - must be overridden
    get key() { throw new Error("Method 'key' must be implemented."); }
    get name() { throw new Error("Method 'name' must be implemented."); }
    get commandsDir() { throw new Error("Method 'commandsDir' must be implemented."); }
    get detectPath() { throw new Error("Method 'detectPath' must be implemented."); }

    // Detection - checks if tool directory exists
    async detect() {
        return await fs.pathExists(this.detectPath);
    }

    // Install commands from flow to tool's commands directory
    async installCommands(flowPath, config) {
        // 1. Ensure target directory exists
        // 2. Read command files from flowPath/commands/
        // 3. Copy each .md file with specsmd- prefix
        // 4. Return list of installed files
    }
}
```

**Key Properties**:
| Property | Type | Description |
|----------|------|-------------|
| `key` | string | Unique identifier (e.g., 'claude', 'cursor', 'copilot') |
| `name` | string | Display name (e.g., 'Claude Code') |
| `commandsDir` | string | Target commands directory (e.g., '.claude/commands') |
| `detectPath` | string | Path to check for tool presence (e.g., '.claude') |

### 2. InstallerFactory (`InstallerFactory.js`)

Factory pattern for creating and retrieving tool installers.

```javascript
class InstallerFactory {
    static getInstallers() {
        return [
            new ClaudeInstaller(),
            new CursorInstaller(),
            new CopilotInstaller()
        ];
    }

    static getInstaller(key) {
        return this.getInstallers().find(i => i.key === key);
    }
}
```

### 3. Constants (`constants.js`)

Theme colors and flow definitions.

```javascript
const THEME_COLORS = {
    primary: '#D97757',      // Terracotta (Claude-inspired)
    secondary: '#ff9966',    // Light orange
    success: '#22c55e',      // Green
    error: '#ef4444',        // Red
    warning: '#f59e0b',      // Amber
    info: '#3b82f6',         // Blue
    dim: '#6b7280'           // Gray
};

const FLOWS = {
    aidlc: {
        name: 'AI-DLC',
        description: 'AI-Driven Development Life Cycle',
        path: 'aidlc'
    },
    agile: {
        name: 'Agile',
        description: 'Sprint-based Agile development',
        path: 'agile',
        disabled: true,
        message: '(Coming soon)'
    }
};
```

### 4. CLI Utilities (`cli-utils.js`)

Terminal UI utilities using chalk, figlet, gradient-string, and oh-my-logo.

**Key Functions**:
| Function | Purpose |
|----------|---------|
| `displayLogo()` | Render gradient ASCII logo |
| `displayHeader(title, icon)` | Section header |
| `displayBox(content, options)` | Bordered box with optional title |
| `displaySuccess/Error/Warning/Info(message)` | Colored message boxes |
| `displayStep(current, total, description)` | Progress indicator |
| `displayStatus(icon, message, color)` | Status line |
| `displayNextSteps(steps)` | Numbered next steps |
| `getVersion()` | Read version from package.json |

**Theme Object**:
```javascript
const theme = {
    primary: chalk.hex(THEME.primary),
    secondary: chalk.hex(THEME.secondary),
    success: chalk.hex(THEME.success),
    error: chalk.hex(THEME.error),
    warning: chalk.hex(THEME.warning),
    info: chalk.hex(THEME.info),
    dim: chalk.hex(THEME.dim)
};
```

### 5. Main Installer (`installer.js`)

Orchestrates the installation flow.

**Installation Flow**:
```
1. detectTools() - Check which tools are installed
2. Display detected tools
3. Prompt user to select tools (multiselect)
4. Prompt user to select flow (AI-DLC, Agile)
5. installFlow(flowKey, toolKeys):
   - Read memory-bank.yaml from flow
   - For each tool: installer.installCommands(flowPath)
   - Copy flow resources to .specsmd/{flowKey}/
   - Create memory-bank directory structure
   - Create manifest.yaml
6. Display success and next steps
```

**Rollback**: If installation fails, remove all created files.

**Uninstall**: Read manifest, remove command files and .specsmd directory.

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `commander` | CLI argument parsing |
| `prompts` | Interactive prompts |
| `chalk` | Terminal colors |
| `figlet` | ASCII art text |
| `gradient-string` | Color gradients |
| `oh-my-logo` | Enhanced ASCII logos |
| `fs-extra` | Extended file system ops |
| `js-yaml` | YAML parsing |

---

## Acceptance Criteria

### AC-1: Tool Detection
- GIVEN a project directory
- WHEN installer runs detectTools()
- THEN it correctly identifies installed tools by checking for their directories

### AC-2: Installation
- GIVEN user selects Claude Code and AI-DLC flow
- WHEN installation completes
- THEN .claude/commands/ contains specsmd-*.md files
- AND .specsmd/aidlc/ contains agents, skills, templates
- AND memory-bank/ directory is created
- AND .specsmd/manifest.yaml records installation

### AC-3: Rollback
- GIVEN installation fails midway
- WHEN error is caught
- THEN all created files are removed
- AND user sees error message with rollback confirmation
