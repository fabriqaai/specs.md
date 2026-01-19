---
id: builder-agent
title: Fire Builder Agent
complexity: high
status: pending
depends_on: [orchestrator-agent]
tags: [agent, core, phase-1]
---

# Fire Builder Agent

## Description

Create the Fire Builder agent responsible for the "execution" phase of FIRE. Handles run creation, work item implementation across all execution modes (Autopilot, Confirm, Validate), and walkthrough generation after completion.

## Acceptance Criteria

- [ ] Create `agents/builder/agent.md` with persona and capabilities
- [ ] Agent can create and manage runs (start, update, finalize)
- [ ] Agent implements Autopilot mode (0 checkpoints, inform only)
- [ ] Agent implements Confirm mode (1 checkpoint, plan approval)
- [ ] Agent implements Validate mode (2 checkpoints, design + implementation review)
- [ ] Agent generates walkthroughs after each work item completion
- [ ] Agent updates state.yaml via scripts after each state change
- [ ] Agent respects work item dependencies (blocked items)
- [ ] Agent can handle partial completion and resume

## Technical Notes

### Builder Responsibilities

| Task | Skill Used | Output |
|------|------------|--------|
| Create run | run-execute | `runs/{NNN}.yaml` |
| Execute work item | run-execute | Code + tests |
| Generate walkthrough | walkthrough-generate | `walkthroughs/{run}-{item}.md` |

### Execution Mode Behavior

```
AUTOPILOT (0 checkpoints):
  Execute → Inform user of changes → Done

CONFIRM (1 checkpoint):
  Show plan → CHECKPOINT → Execute → Done

VALIDATE (2 checkpoints):
  Show design doc → CHECKPOINT → Execute → Show summary → CHECKPOINT → Done
```

### Agent Structure

```xml
<!-- agents/builder/agent.md -->
<agent name="fire-builder">
  <persona>
    You are the FIRE Builder. You execute work items, write code,
    run tests, and generate walkthroughs for human review.
  </persona>

  <principles>
    <principle>Follow the execution mode strictly</principle>
    <principle>Update state after every significant action</principle>
    <principle>Generate walkthroughs for traceability</principle>
    <principle>Respect brownfield: search before create, extend over duplicate</principle>
  </principles>

  <critical-rules>
    <rule>NEVER skip checkpoints in Confirm/Validate modes</rule>
    <rule>ALWAYS generate walkthrough after completing work item</rule>
    <rule>ALWAYS update state.yaml via scripts, never manually</rule>
  </critical-rules>

  <skills>
    <skill name="run-execute" path="./skills/run-execute"/>
    <skill name="walkthrough-generate" path="./skills/walkthrough-generate"/>
    <skill name="state-management" path="../../skills/state-management"/>
  </skills>
</agent>
```

### File Location

```
fire/agents/builder/
├── agent.md
└── skills/
    ├── run-execute/
    │   ├── SKILL.md
    │   ├── autopilot.md        # Mode-specific guidance
    │   ├── confirm.md
    │   ├── validate.md
    │   ├── templates/
    │   │   └── run-log.yaml.hbs
    │   └── scripts/
    │       ├── run-create.ts
    │       ├── run-update.ts
    │       └── run-finalize.ts
    │
    └── walkthrough-generate/
        ├── SKILL.md
        ├── templates/
        │   └── walkthrough.md.hbs
        └── scripts/
            └── render-walkthrough.ts
```

### Run Log Structure

```yaml
run:
  id: 003
  started: 2026-01-19T10:00:00Z
  ended: 2026-01-19T12:30:00Z
  status: completed

work_items:
  - intent: auth-system
    item: login
    status: completed
    mode: confirm
    files_created: [...]
    files_modified: [...]
    tests_added: 8
    coverage: 92

decisions:
  - decision: "JWT expiry"
    choice: "24 hours"
    rationale: "Balance security/UX"
```

## Dependencies

- orchestrator-agent: Builder is invoked by orchestrator
- state-management: For updating state during/after runs
