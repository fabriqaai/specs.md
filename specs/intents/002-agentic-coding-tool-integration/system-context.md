# System Context: Agentic Coding Tool Integration

## Overview

This document defines the boundaries and integration points for the Agentic Coding Tool Integration system.

---

## System Boundary

```
┌────────────────────────────────────────────────────────────────────┐
│                         External Systems                            │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  ┌───────────┐ │
│  │Claude Code │  │   Cursor   │  │GitHub Copilot │  │Antigravity│ │
│  │  (Tool)    │  │   (Tool)   │  │    (Tool)     │  │  (Tool)   │ │
│  └─────┬──────┘  └─────┬──────┘  └──────┬────────┘  └─────┬─────┘ │
│        │               │                │                  │       │
└────────┼───────────────┼────────────────┼──────────────────┼───────┘
         │               │                │                  │
         │  Slash Commands / Rules / Agents                  │
         │               │                │                  │
┌────────▼───────────────▼────────────────▼──────────────────▼───────┐
│                      specsmd CLI                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Installer System                          │   │
│  │  ┌───────────────┐  ┌───────────────────────────────────┐   │   │
│  │  │InstallerFactory│─▶│ Tool-Specific Installers          │   │   │
│  │  └───────────────┘  │ (Claude, Cursor, Copilot,         │   │   │
│  │                      │  Antigravity, Windsurf, etc.)     │   │   │
│  │                      └───────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                    │
│                                │ Installs                           │
│                                ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Project Directory                         │   │
│  │  ┌─────────────┐  ┌───────────────────┐  ┌──────────────┐   │   │
│  │  │  .specsmd/  │  │.claude/commands/  │  │memory-bank/  │   │   │
│  │  │  (runtime)  │  │.claude/agents/    │  │ (artifacts)  │   │   │
│  │  │             │  │.cursor/rules/     │  │              │   │   │
│  │  │             │  │.github/agents/    │  │              │   │   │
│  │  │             │  │.agent/agents/     │  │              │   │   │
│  │  └─────────────┘  └───────────────────┘  └──────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

---

## External Systems

### Claude Code
- **Type**: AI-powered coding assistant
- **Integration**: Slash commands in `.claude/commands/` + agents in `.claude/agents/`
- **Interface**: `/specsmd*` commands and Claude-invoked agents
- **Features**: Supports both user-invoked commands and AI-delegated agents

### Cursor
- **Type**: AI-powered code editor
- **Integration**: Rules in `.cursor/rules/` (MDC format with frontmatter)
- **Interface**: Rules with `alwaysApply: true` for automatic activation

### GitHub Copilot
- **Type**: AI pair programmer
- **Integration**: Workspace agents in `.github/agents/` (`.agent.md` format)
- **Interface**: `@specsmd*` agent invocation

### Google Antigravity
- **Type**: AI-powered IDE
- **Integration**: Agents in `.agent/agents/`
- **Interface**: Agent-based invocation

---

## Internal Components

### CLI Entry Point
- **Component**: `bin/cli.js`
- **Responsibility**: Parse commands, display UI, orchestrate installation

### Installer Factory
- **Component**: `lib/InstallerFactory.js`
- **Responsibility**: Create appropriate installer based on detected tools

### Tool Installers
- **Components**: `ClaudeInstaller.js`, `CursorInstaller.js`, `CopilotInstaller.js`, `AntigravityInstaller.js`
- **Responsibility**: Tool-specific installation logic
- **Note**: ClaudeInstaller and CopilotInstaller install both commands and agents from the same source

---

## Data Flow

### Installation Flow
```
User runs `npx specsmd install`
         │
         ▼
CLI detects available tools
         │
         ▼
InstallerFactory creates appropriate installer(s)
         │
         ▼
Installer copies:
  - Command/rule files to tool directory
  - Agent files (for Claude Code: .claude/agents/, for Copilot: .github/agents/)
  - .specsmd/ runtime files
  - memory-bank/ structure (via project-init)
         │
         ▼
Installation manifest created
```

---

## Integration Contracts

### File Formats

Each tool expects specific file formats:

**Claude Code Commands** (`.claude/commands/*.md`)

- Filename as command name
- Content as system prompt for the agent

**Claude Code Agents** (`.claude/agents/*.md`)

- Same content as commands, sourced from `commands/` folder
- Content references full agent definition in `.specsmd/aidlc/agents/`

**Cursor Rules** (`.cursor/rules/*.mdc`)

- YAML frontmatter with `alwaysApply: true`
- MDC format content

**GitHub Copilot Agents** (`.github/agents/*.agent.md`)

- Markdown content with agent definition

**Google Antigravity Agents** (`.agent/agents/*.md`)

- Markdown content with agent definition

### Directory Conventions

| Tool | Commands/Rules Path | Agents/Subagents Path |
|------|---------------------|----------------------|
| Claude Code | `.claude/commands/` | `.claude/agents/` |
| Cursor | `.cursor/rules/` (MDC) | — |
| GitHub Copilot | — | `.github/agents/` |
| Google Antigravity | — | `.agent/agents/` |

---

## Constraints

- Tools may or may not be installed on user's system
- Installation must be idempotent (can run multiple times safely)
- No tool-specific configuration files modified (only specsmd files added)
