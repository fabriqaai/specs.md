# Units: Agentic Coding Tool Integration

## Unit Decomposition

This intent is decomposed into units representing the installer infrastructure and tool-specific integrations.

---

## Unit 1: CLI & Installer Core

Core CLI application and installation orchestration logic.

**Components:**

- `bin/cli.js` - Commander.js CLI entry point
- `lib/cli-utils.js` - Terminal UI utilities (chalk, figlet, gradient)
- `lib/constants.js` - Theme colors and flow definitions
- `lib/installer.js` - Installation orchestrator

**Responsibilities:**

- Parse CLI commands
- Detect available agentic coding tools
- Display interactive prompts
- Orchestrate installation flow
- Create installation manifest

---

## Unit 2: Installer Factory

Factory pattern for creating tool-specific installers.

**Components:**

- `lib/InstallerFactory.js` - Factory class
- `lib/installers/ToolInstaller.js` - Abstract base class

**Responsibilities:**

- Create appropriate installer instance based on tool type
- Provide common interface for all installers

---

## Unit 3: Claude Code Installer

Installer for Claude Code integration.

**Target:** `.claude/commands/` | **Extension:** `.md`

---

## Unit 4: Cursor Installer

Installer for Cursor integration using MDC format.

**Target:** `.cursor/rules/` | **Extension:** `.mdc` | **Special:** Adds frontmatter

---

## Unit 5: GitHub Copilot Installer

Installer for GitHub Copilot workspace agents.

**Target:** `.github/agents/` | **Extension:** `.agent.md` | **Special:** Name transform

---

## Unit 6: Google Antigravity Installer

Installer for Google Antigravity IDE integration.

**Target:** `.agent/agents/` | **Extension:** `.md`

---

## Unit 7: Windsurf Installer

Installer for Codeium Windsurf IDE integration.

**Target:** `.windsurf/workflows/` | **Extension:** `.md` | **Special:** Adds frontmatter

---

## Unit 8: Cline Installer

Installer for Cline (VS Code extension) integration.

**Target:** `.clinerules/` | **Extension:** `.md`

---

## Unit 9: Roo Code Installer

Installer for Roo Code integration.

**Target:** `.roo/commands/` | **Extension:** `.md`

---

## Unit 10: Kiro CLI Installer

Installer for AWS Kiro CLI integration.

**Target:** `.kiro/steering/` | **Extension:** `.md`

---

## Unit 11: Gemini CLI Installer

Installer for Google Gemini CLI integration.

**Target:** `.gemini/` | **Extension:** `.md`

---

## Unit 12: Codex Installer

Installer for OpenAI Codex integration.

**Target:** `.codex/` | **Extension:** `.md`

---

## Unit 13: Kilo Code Installer

Installer for Kilo Code integration.

**Target:** `.kilo/` | **Extension:** `.md`

---

## Unit 14: OpenCode Installer

Installer for OpenCode integration.

**Target:** `.opencode/` | **Extension:** `.md`

---

## Unit Dependency Graph

```text
┌─────────────────┐
│   CLI (cli.js)  │
└────────┬────────┘
         │
┌────────▼────────┐
│  Installer Core │
│ (installer.js)  │
└────────┬────────┘
         │
┌────────▼────────┐
│InstallerFactory │
└────────┬────────┘
         │
         ├──────┬──────┬──────┬──────┬──────┬──────┐
         │      │      │      │      │      │      │
      Claude Cursor Copilot Anti- Wind- Cline  ...
       Inst.  Inst.  Inst. gravity surf  Inst.
         │      │      │      │      │      │
         └──────┴──────┴──────┴──────┴──────┴──────┘
                           │
                  ┌────────▼────────┐
                  │  ToolInstaller  │
                  │     (base)      │
                  └─────────────────┘
```

---

## Installation Summary

| Tool | Directory | Extension | Special Handling |
|------|-----------|-----------|------------------|
| Claude Code | `.claude/commands/` | `.md` | Standard |
| Cursor | `.cursor/rules/` | `.mdc` | Adds frontmatter |
| GitHub Copilot | `.github/prompts/` + `.github/agents/` | `.prompt.md` + `.agent.md` | Both prompts and agents |
| Google Antigravity | `.agent/agents/` | `.md` | Standard |
| Windsurf | `.windsurf/workflows/` | `.md` | Adds frontmatter |
| Cline | `.clinerules/` | `.md` | Standard |
| Roo Code | `.roo/commands/` | `.md` | Standard |
| Kiro CLI | `.kiro/steering/` | `.md` | Standard |
| Gemini CLI | `.gemini/commands/` | `.toml` | Converts to TOML |
| Codex | `.codex/` | `.md` | Standard |
| Kilo Code | `.kilo/` | `.md` | Standard |
| OpenCode | `.opencode/agent/` | `.md` | Standard |
