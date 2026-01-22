# FIRE Flow

**Fast Intent-Run Engineering** — A simplified AI-native development methodology.

## Overview

FIRE reduces the complexity of AI-assisted development by flattening the hierarchy:

```
Intent → Work Item → Run
```

Unlike traditional methodologies with 10-26 checkpoints, FIRE uses adaptive checkpoints (0-2) based on work item complexity.

## Quick Start

```bash
# Initialize FIRE in your project
/specsmd-fire

# Or directly invoke specific agents
/specsmd-fire-planner    # For planning work
/specsmd-fire-builder    # For executing work
```

## Execution Modes

| Mode | Checkpoints | Complexity | Use For |
|------|-------------|------------|---------|
| **Autopilot** | 0 | Low | Bug fixes, minor updates |
| **Confirm** | 1 | Medium | Standard features |
| **Validate** | 2 | High | Security, payments, architecture |

## Project Structure

When initialized, FIRE creates:

```
.specs-fire/
├── state.yaml           # Central state (source of truth)
├── intents/             # Intent briefs and work items
│   └── {intent-id}/
│       ├── brief.md
│       └── work-items/
│           └── {work-item-id}.md
├── runs/                # Run logs and walkthroughs
│   └── {run-id}/
│       ├── run.md
│       └── walkthrough.md
└── standards/           # Project standards
    ├── tech-stack.md
    └── coding-standards.md
```

## Agents

### Orchestrator (`/specsmd-fire`)

Routes users based on project state:
- New project → Initialize
- No intent → Capture intent
- No work items → Decompose
- Pending work → Execute

### Planner (`/specsmd-fire-planner`)

Handles planning:
- **intent-capture** — Capture user intent through conversation
- **work-item-decompose** — Break intent into executable work items
- **design-doc-generate** — Create design docs for Validate mode

### Builder (`/specsmd-fire-builder`)

Handles execution:
- **run-execute** — Execute work items with mode-appropriate checkpoints
- **walkthrough-generate** — Generate implementation documentation
- **run-status** — Show current run progress

## Flow Directory Structure

```
src/flows/fire/
├── agents/
│   ├── orchestrator/
│   │   ├── agent.md
│   │   └── skills/
│   │       ├── project-init/
│   │       ├── route/
│   │       └── status/
│   ├── planner/
│   │   ├── agent.md
│   │   └── skills/
│   │       ├── intent-capture/
│   │       ├── work-item-decompose/
│   │       └── design-doc-generate/
│   └── builder/
│       ├── agent.md
│       └── skills/
│           ├── run-execute/
│           ├── walkthrough-generate/
│           └── run-status/
├── commands/
│   ├── fire.md
│   ├── fire-planner.md
│   └── fire-builder.md
├── templates/
│   ├── intents/
│   ├── runs/
│   └── standards/
├── memory-bank.yaml
└── quick-start.md
```

## Comparison with AI-DLC

| Aspect | AI-DLC | FIRE |
|--------|--------|------|
| Hierarchy | Intent → Unit → Story | Intent → Work Item |
| Checkpoints | 10-26 per feature | 0-2 per work item |
| Phases | Inception → Construction → Operations | Plan → Execute |
| Artifacts | Extensive | Minimal |
| Best for | Large initiatives, teams | Rapid delivery, individuals |

## Configuration

See `memory-bank.yaml` for:
- Artifact paths
- Naming conventions
- Execution modes
- Agent ownership
