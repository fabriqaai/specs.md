# Unit Brief: Windsurf Installer

## Overview

The Windsurf Installer handles installation of specsmd workflows into Windsurf's `.windsurf/workflows/` directory with required frontmatter.

---

## Scope

### In Scope

- Windsurf detection
- Workflow file installation to `.windsurf/workflows/`
- Adding frontmatter with description

### Out of Scope

- Base installation logic (handled by ToolInstaller)
- Other tool installations

---

## Technical Context

### File Structure

```text
src/lib/installers/
└── WindsurfInstaller.js
```

### Target Installation Path

```text
project-root/
└── .windsurf/
    └── workflows/
        ├── specsmd-master-agent.md
        ├── specsmd-inception-agent.md
        ├── specsmd-construction-agent.md
        └── specsmd-operations-agent.md
```

---

## Implementation Details

### WindsurfInstaller Class

Extends `ToolInstaller` and overrides `installCommands()` to add frontmatter.

### Properties

| Property | Value | Description |
|----------|-------|-------------|
| `key` | `'windsurf'` | Unique identifier for factory lookup |
| `name` | `'Windsurf'` | Display name in CLI |
| `commandsDir` | `'.windsurf/workflows'` | Where to install workflow files |
| `detectPath` | `'.windsurf'` | Directory to check for detection |

### Detection Logic

Windsurf is detected if `.windsurf/` directory exists in the project root.

### Frontmatter Format

Windsurf requires frontmatter with a description field:

```markdown
---
description: specsmd-master-agent
---

# Activate Master Agent
...
```

The description is derived from the target filename (e.g., `specsmd-master-agent.md` → `specsmd-master-agent`).

---

## Windsurf Reference

Windsurf is Codeium's AI-powered IDE, featuring:

- Cascade: Multi-file AI editing
- Flows: AI-driven workflows
- Rules: Project and global configuration

### Configuration Locations

| Type | Location |
|------|----------|
| Workflows | `.windsurf/workflows/` |
| Project rules | `.windsurf/` |
| Global rules | `~/.windsurf/` |

---

## Acceptance Criteria

### AC-1: Detection

- GIVEN a project with `.windsurf/` directory
- WHEN detectTools() runs
- THEN Windsurf is listed as detected

### AC-2: Installation

- GIVEN user selects Windsurf
- WHEN installation completes
- THEN `.windsurf/workflows/specsmd-*.md` files exist
- AND files contain frontmatter with description
- AND files contain workflow definitions

### AC-3: Frontmatter

- GIVEN a source file `master-agent.md`
- WHEN installed to Windsurf
- THEN the file has frontmatter `description: specsmd-master-agent`

### AC-4: Non-Detection

- GIVEN a project without `.windsurf/` directory
- WHEN detectTools() runs
- THEN Windsurf is NOT listed as detected
- BUT user can still select it manually
