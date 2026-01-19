---
id: planner-agent
title: Fire Planner Agent
complexity: high
status: pending
depends_on: [orchestrator-agent]
tags: [agent, core, phase-1]
---

# Fire Planner Agent

## Description

Create the Fire Planner agent responsible for the "planning" phase of FIRE. Handles intent capture, work item decomposition, design document generation (for Validate mode), and project standards initialization.

## Acceptance Criteria

- [ ] Create `agents/planner/agent.md` with persona and capabilities
- [ ] Agent can capture new intents through structured conversation
- [ ] Agent can decompose intents into work items with complexity assessment
- [ ] Agent generates design documents for Validate mode work items
- [ ] Agent handles greenfield standards initialization (AI-suggested + manual)
- [ ] Agent handles brownfield standards initialization (auto-detection)
- [ ] Integrates with state-management for all state updates
- [ ] Uses templates for consistent document generation

## Technical Notes

### Planner Responsibilities

| Task | Skill Used | Output |
|------|------------|--------|
| Capture intent | intent-capture | `intents/{id}/brief.md` |
| Decompose work | work-item-decompose | `intents/{id}/work-items/*.md` |
| Generate design doc | design-doc-generate | `intents/{id}/work-items/{id}-design.md` |
| Init standards | standards-init | `standards/*.md` |

### Agent Structure

```xml
<!-- agents/planner/agent.md -->
<agent name="fire-planner">
  <persona>
    You are the FIRE Planner. You help users define what they want to build,
    break it down into actionable work items, and create design documents
    for complex tasks.
  </persona>

  <principles>
    <principle>Listen more than assume - ask clarifying questions</principle>
    <principle>Keep work items atomic - one deliverable per item</principle>
    <principle>Assess complexity honestly - don't underestimate</principle>
    <principle>Identify dependencies between work items</principle>
  </principles>

  <skills>
    <skill name="intent-capture" path="./skills/intent-capture"/>
    <skill name="work-item-decompose" path="./skills/work-item-decompose"/>
    <skill name="design-doc-generate" path="./skills/design-doc-generate"/>
    <skill name="standards-init" path="./skills/standards-init"/>
    <skill name="state-management" path="../../skills/state-management"/>
    <skill name="workspace-detect" path="../../skills/workspace-detect"/>
  </skills>
</agent>
```

### File Location

```
fire/agents/planner/
├── agent.md
└── skills/
    ├── intent-capture/
    │   ├── SKILL.md
    │   ├── templates/
    │   │   └── intent-brief.md.hbs
    │   └── scripts/
    │       └── validate-intent.ts
    │
    ├── work-item-decompose/
    │   ├── SKILL.md
    │   ├── templates/
    │   │   └── work-item.md.hbs
    │   └── scripts/
    │       └── generate-work-items.ts
    │
    ├── design-doc-generate/
    │   ├── SKILL.md
    │   ├── templates/
    │   │   └── design-doc.md.hbs
    │   └── scripts/
    │       └── render-design-doc.ts
    │
    └── standards-init/
        ├── SKILL.md
        ├── greenfield.md
        ├── brownfield.md
        ├── templates/
        │   ├── tech-stack.md.hbs
        │   ├── coding-standards.md.hbs
        │   └── system-context.md.hbs
        └── scripts/
            ├── suggest-standards.ts
            └── generate-standards.ts
```

## Dependencies

- orchestrator-agent: Planner is invoked by orchestrator
- state-management: For updating state after intent/work-item creation
