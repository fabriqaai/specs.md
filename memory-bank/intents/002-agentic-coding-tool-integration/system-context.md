# System Context: Agentic Coding Tool Integration

## Overview

This document defines the boundaries and integration points for the Agentic Coding Tool Integration system.

---

## System Boundary

```text
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
│  │  │  (runtime)  │  │.cursor/rules/     │  │ (artifacts)  │   │   │
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
- **Integration**: Slash commands in `.claude/commands/`
- **Interface**: `/specsmd*` commands
- **Features**: Commands run in the main conversation, so agents can stop at user checkpoints (subagents can't ask the user questions)

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

```text
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
  - Agent files (for Copilot: .github/agents/)
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

- Not installed. Claude Code subagents need `name:` frontmatter and can't ask the user questions, so the command files don't work there
- The installer removes `specsmd-*` copies that earlier versions installed

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
| Claude Code | `.claude/commands/` | — |
| Cursor | `.cursor/rules/` (MDC) | — |
| GitHub Copilot | — | `.github/agents/` |
| Google Antigravity | — | `.agent/agents/` |

---

## Constraints

- Tools may or may not be installed on user's system
- Installation must be idempotent (can run multiple times safely)
- No tool-specific configuration files modified (only specsmd files added)
