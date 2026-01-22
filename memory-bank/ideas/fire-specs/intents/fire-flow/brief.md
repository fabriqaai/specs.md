---
id: fire-flow
title: Implement fabriqa FIRE Flow
status: pending
priority: high
created: 2026-01-19
---

# Implement fabriqa FIRE Flow

## Overview

Implement fabriqa FIRE (Fast Intent-Run Engineering) as a new flow in specs.md, alongside the existing `aidlc` and `simple` flows. FIRE simplifies AI-driven development with a flattened hierarchy (Intent → Work Item → Run), adaptive checkpoints (0-2 per work item), and first-class brownfield/monorepo support.

## Requirements

### Functional

- Implement central `state.yaml` for project state management
- Create 3-agent architecture: Orchestrator, Planner, Builder
- Support adaptive execution modes: Autopilot (0 checkpoints), Confirm (1), Validate (2)
- Skills follow Anthropic pattern: SKILL.md + templates/ + scripts/
- Node.js scripts for deterministic operations (state updates, template rendering)
- Workspace detection for greenfield/brownfield/monorepo projects
- Standards initialization with AI-suggested and manual flows
- Walkthrough document generation for human review
- Bug report skill with anonymization support

### Non-Functional

- Pure XML workflow definitions for strict AI adherence
- Skills organized per-agent with shared skills folder
- Templates use Handlebars for consistent output generation
- Scripts invocable via CLI for MVP (`specsmd fire action <name>`)
- Progressive disclosure: load skill details only when needed
- Maintain compatibility with existing specs.md CLI infrastructure

## Success Criteria

- [ ] Can initialize a new FIRE project with `specsmd init --flow fire`
- [ ] Can create intents and decompose into work items
- [ ] Can execute runs with all 3 execution modes working
- [ ] State persists correctly across sessions
- [ ] Walkthroughs generated after each work item completion
- [ ] Brownfield projects detected and handled appropriately
- [ ] All scripts execute deterministically with consistent output
- [ ] Existing aidlc and simple flows unaffected

## Architecture Decision

### Agent Structure

```
fire/
├── agents/
│   ├── orchestrator/
│   │   ├── agent.md
│   │   └── skills/
│   ├── planner/
│   │   ├── agent.md
│   │   └── skills/
│   └── builder/
│       ├── agent.md
│       └── skills/
├── skills/                  # Shared skills
├── templates/               # Shared templates (if any)
└── memory-bank.yaml         # Schema definition
```

### Execution Modes

| Mode | Checkpoints | Use Case |
|------|-------------|----------|
| Autopilot | 0 | Simple, high-confidence tasks |
| Confirm | 1 | Medium complexity, plan approval needed |
| Validate | 2 | Complex/architectural, design + implementation review |

### Key Differences from AI-DLC

| Aspect | AI-DLC | FIRE |
|--------|--------|------|
| Hierarchy | Intent → Unit → Story → Bolt | Intent → Work Item → Run |
| Checkpoints | 10-26 per feature | 2-6 per feature |
| Agents | 4 (Master, Inception, Construction, Operations) | 3 (Orchestrator, Planner, Builder) |
| Artifacts | 15-20 per feature | 3-5 per feature |

## References

- PRD: `memory-bank/ideas/fabriqa-fire-prd.md`
- Anthropic Guides: `memory-bank/ideas/anthropic-guides.md`
- Anthropic Skills Pattern: https://github.com/anthropics/skills
