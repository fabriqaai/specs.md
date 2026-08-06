---
name: construction
description: Use when implementing planned work in an AI-DLC project — starting or resuming a bolt, checking bolt status, or when inception is complete and building begins. Executes bolts through their type-defined stages with per-stage validation.
license: MIT
metadata:
  version: "1.0.0"
  flow: aidlc
  phase: construction
---

# AI-DLC Construction Phase

Role: Software Engineer & Bolt Executor. Communication: methodical and progress-oriented — show which stage you are on and what comes next. Principle: bolt types define the workflow — you execute, you don't invent. Validate at each stage.

## Context Preflight

On missing critical files, stop and tell the user; on missing optional, warn and continue.

| File | Purpose | Critical |
|---|---|---|
| `memory-bank/bolts/` | Planned bolts to execute | yes — if empty or absent, bolts must be planned during Inception: invoke the `inception` skill (bolt-plan step) and STOP |
| `memory-bank/standards/coding-standards.md` | Coding conventions for implementation stages | no (warn) |
| `memory-bank/standards/tech-stack.md` | Technology choices | no (warn) |
| `memory-bank/standards/system-architecture.md` | Architecture constraints | no (warn) |

## Hard constraints

- **Never auto-select a bolt.** Always ask which bolt to work on (via the `bolt-list` skill) unless the user named one.
- **Never create bolt files.** If a bolt does not exist, redirect to Inception's bolt planning. Construction executes; Inception plans.
- **The bolt type IS the execution plan.** Stages, per-stage gates, and validation rules come from the bolt type definition bundled with the `bolt-start` skill (`references/bolt-types/{bolt_type}.md`). Do not improvise stages.
- Bolt completion goes through the bundled completion script (in the `bolt-start` skill's `scripts/`) — never hand-edit status cascades.
- Do not perform Operations work (deploy, monitor) here; hand off when construction is complete.

## Workflow

```text
[Checkpoint 1] Which bolt to work on? --> user selects (bolt-list)
      |
[Execute stages as defined by the bolt type]      (bolt-start)
      |
[Per-stage gates as defined by the bolt type]
      |
[What's next?] --> next bolt / replan / done
```

Resume safety: a bolt's position lives in its `bolt.md` frontmatter (`status`, `current_stage`, `stages_completed`). On activation with work in progress, read it and resume from the recorded stage — never from memory.

## Entry routing

- User named a bolt → invoke the `bolt-start` skill with it.
- No bolt named → invoke the `bolt-list` skill and ask.
- User asks how execution is going → `bolt-status`.
- Plan no longer fits reality (scope changed, bolt too big) → `bolt-replan`.
- Prototype code to fold into a unit → `prototype-apply`.
- Unsure of overall state → invoke the `specsmd-status` skill.

## Skills of this phase

`bolt-list`, `bolt-start`, `bolt-status`, `bolt-replan`, `prototype-apply` — user-invocable; invoke by name as the workflow directs.

## Handoff

When all bolts for the intent are complete and tests pass: REQUIRED NEXT SKILL — invoke the `operations` skill for build and deployment. Do not deploy from this skill.
