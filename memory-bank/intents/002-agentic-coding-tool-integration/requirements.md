---
status: complete
completed: 2025-12-25
note: "Implemented before specsmd dogfooding. Stories not tracked in AI-DLC."
---

# Intent: Agentic Coding Tool Integration

## Overview

Provide seamless integration with multiple agentic coding tools (Claude Code, Cursor, GitHub Copilot) through a unified installation mechanism and consistent slash command interface.

---

## Functional Requirements

### FR-1: Multi-Tool Support

- FR-1.1: System SHALL support Claude Code integration (commands + agents)
- FR-1.2: System SHALL support Cursor integration (rules with MDC format)
- FR-1.3: System SHALL support GitHub Copilot integration (workspace agents)
- FR-1.4: System SHALL support Google Antigravity integration
- FR-1.5: System SHALL support additional tools: Windsurf, Cline, Roo Code, Kiro CLI, Gemini CLI, Codex, Kilo Code, OpenCode
- FR-1.6: System SHALL detect which agentic coding tools are available on the user's system
- FR-1.7: System SHALL allow user to select which tools to install to

### FR-2: Interactive Installation

- FR-2.1: System SHALL provide an interactive CLI installer via `npx specsmd install`
- FR-2.2: Installer SHALL display tool detection results
- FR-2.3: Installer SHALL allow flow selection (AI-DLC, future: Agile)
- FR-2.4: Installer SHALL copy appropriate files to each selected tool

### FR-3: File Installation

- FR-3.1: For Claude Code: Install slash commands to `.claude/commands/`
- FR-3.2: For Claude Code: Install agents to `.claude/agents/`
- FR-3.3: For Cursor: Install rules to `.cursor/rules/` (`.mdc` format with frontmatter)
- FR-3.4: For GitHub Copilot: Install agents to `.github/agents/` (`.agent.md` format)
- FR-3.5: For Google Antigravity: Install agents to `.agent/agents/`
- FR-3.6: For all tools: Install `.specsmd/` directory with agents, skills, templates

### FR-4: Slash Commands

- FR-4.1: Each tool SHALL have access to `/specsmd-master-agent` (Master Agent)
- FR-4.2: Each tool SHALL have access to `/specsmd-inception-agent`
- FR-4.3: Each tool SHALL have access to `/specsmd-construction-agent`
- FR-4.4: Each tool SHALL have access to `/specsmd-operations-agent`

### FR-5: Installation Manifest

- FR-5.1: System SHALL create `.specsmd/manifest.yaml` after installation
- FR-5.2: Manifest SHALL record installed flow, version, timestamp, and tools

---

## Non-Functional Requirements

### NFR-1: Usability

- Installation SHALL complete in under 30 seconds
- CLI SHALL provide clear progress feedback
- CLI SHALL use color-coded output for status

### NFR-2: Compatibility

- System SHALL work on macOS, Linux, and Windows
- System SHALL work with Node.js 18+
- System SHALL not require global npm installation

### NFR-3: Extensibility

- New tool installers SHALL be addable via factory pattern
- New flows SHALL be addable without modifying core installer

---

## Acceptance Criteria

### AC-1: Installation

- GIVEN a project with Claude Code available
- WHEN user runs `npx specsmd install`
- THEN installer detects Claude Code and offers it for selection

### AC-2: Slash Commands

- GIVEN a successful installation to Claude Code
- WHEN user types `/specsmd-master-agent` in Claude Code
- THEN Master Agent activates

### AC-3: Multi-Tool

- GIVEN a project with both Claude Code and Cursor
- WHEN user selects both tools during installation
- THEN both tools receive slash commands and can invoke agents
