---
id: orchestrator-agent
title: Fire Orchestrator Agent
complexity: medium
status: pending
depends_on: [state-management]
tags: [agent, core, phase-1]
---

# Fire Orchestrator Agent

## Description

Create the Fire Orchestrator agent that serves as the entry point for all FIRE interactions. It reads project state, determines current phase, and routes to the appropriate agent (Planner or Builder). Handles session resume and cross-agent transitions.

## Acceptance Criteria

- [ ] Create `agents/orchestrator/agent.md` with persona and routing logic
- [ ] Agent reads `state.yaml` at session start
- [ ] Detects if there's an active run to resume
- [ ] Routes to Planner for: new intents, work item decomposition, standards init
- [ ] Routes to Builder for: run execution, implementation tasks
- [ ] Handles "what should I work on next?" queries
- [ ] Suggests next work items based on dependencies and priorities
- [ ] Create session-manage skill for resume logic

## Technical Notes

### Routing Logic

```
SESSION START
    │
    ▼
Read state.yaml
    │
    ├── Active run exists? ──YES──► "Resume run {N} or start new?"
    │                                    │
    │                                    ├── Resume ──► fire-builder
    │                                    └── New ────► Analyze pending work
    │
    └── No active run
            │
            ▼
        Analyze project state
            │
            ├── No intents? ──────────► fire-planner (intent capture)
            ├── No work items? ───────► fire-planner (decomposition)
            ├── Pending work items? ──► Suggest next, route to fire-builder
            └── All done? ────────────► "Project complete!" or new intent
```

### Agent Structure

```xml
<!-- agents/orchestrator/agent.md -->
<agent name="fire-orchestrator">
  <persona>
    You are the FIRE Orchestrator. You manage session state and route
    users to the appropriate agent based on project context.
  </persona>

  <critical-rules>
    <rule>ALWAYS read state.yaml first</rule>
    <rule>NEVER implement code - route to fire-builder</rule>
    <rule>NEVER capture intents - route to fire-planner</rule>
    <rule>Suggest work based on dependencies (blocked items last)</rule>
  </critical-rules>

  <skills>
    <skill name="session-manage" path="./skills/session-manage"/>
    <skill name="state-management" path="../../skills/state-management"/>
  </skills>

  <routing>
    <route to="fire-planner" when="need intent capture, decomposition, standards"/>
    <route to="fire-builder" when="need implementation, run execution"/>
  </routing>
</agent>
```

### File Location

```
fire/agents/orchestrator/
├── agent.md
└── skills/
    └── session-manage/
        ├── SKILL.md
        └── scripts/
            └── session-resume.ts
```

## Dependencies

- state-management: Must be able to read/write state.yaml
