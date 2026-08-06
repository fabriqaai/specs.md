---
name: inception
description: Use when starting new functionality in an AI-DLC project — a new feature, intent, or requirement — or when resuming incomplete inception work. Runs the AI-DLC Inception phase, producing requirements, system context, units, stories, and a bolt plan in memory-bank/, with human checkpoints.
license: MIT
metadata:
  version: "1.0.0"
  flow: aidlc
  phase: inception
---

# AI-DLC Inception Phase

Role: Product Strategist & Requirements Architect. Communication: inquisitive and thorough — ask clarifying questions before assumptions. Principle: clarify FIRST, elaborate SECOND. Complete inception before construction.

## Context Preflight

Read before doing anything else. On missing critical files, stop and tell the user; on missing optional files, warn and continue.

| File | Purpose | Critical |
|---|---|---|
| `references/memory-bank.yaml` (this skill's directory) | Artifact schema, naming conventions, ownership | yes |
| `memory-bank/standards/` (any standard files) | Project standards; if absent, project is uninitialized → invoke the `aidlc-init` skill first and STOP | yes |
| `memory-bank/project.yaml` | Project type awareness | no |
| `memory-bank/glossary.md` | Consistent terminology | no |

## Hard constraints

- Do NOT write application code, scaffold projects, or execute bolts in this phase. Construction begins only after Checkpoint 4.
- Do NOT skip or simulate checkpoints. Each is a hard gate requiring explicit user approval.
- Do NOT modify artifacts owned by other phases (see `ownership` in the schema).
- Phases are sequential: Inception → Construction → Operations. Do not blend them.

## Workflow (4 checkpoints)

```text
[User Request]
      |
[Checkpoint 1] Clarifying questions --> user answers        (in `requirements` skill)
      |
[Generate requirements]
      |
[Checkpoint 2] Requirements review --> user approves        (in `requirements` skill)
      |
[Generate context + units + stories + bolt plan]            <-- AUTO-CONTINUE CHAIN
      |
[Checkpoint 3] Artifacts review --> user approves           (in `review` skill)
      |
[Checkpoint 4] Ready for construction? --> hand off         (in `review` skill)
```

### Auto-continue chain (CRITICAL)

Between checkpoints 2 and 3, run this chain without asking for confirmation:

`context` → `units` → `story-create` → `bolt-plan` → `review`

When one skill completes, immediately invoke the next (REQUIRED NEXT SKILL semantics — do not stop, do not summarize progress and wait). Stop ONLY at the four checkpoints above.

### Chain ledger (resume safety)

After each chain step completes, append a line to the intent's `inception-log.md`:
`chain: <completed-skill> done -> next: <next-skill> (<ISO-8601 timestamp>)`

On activation, if an intent has an inception-log with an incomplete chain, resume from the recorded `next:` step instead of restarting. Derive position from the ledger and which artifacts exist — never from conversation memory.

## Entry routing

- New feature/idea, no intent yet → invoke the `intent-create` skill, then `requirements`.
- Intent exists, no requirements → `requirements`.
- Requirements approved, chain incomplete → resume the chain per the ledger.
- All artifacts done, not reviewed → `review`.
- User asks to see intents → `intent-list`. Rough idea to explore → `vibe-to-spec`.
- Unsure of state → invoke the `specsmd-status` skill first.

## Skills of this phase

`intent-create`, `intent-list`, `requirements`, `context`, `units`, `story-create`, `bolt-plan`, `review`, `vibe-to-spec` — all user-invocable; invoke them by name as the workflow directs.

## Artifacts created

| Artifact | Location |
|---|---|
| Requirements | `memory-bank/intents/{intent}/requirements.md` |
| System context | `memory-bank/intents/{intent}/system-context.md` |
| Units | `memory-bank/intents/{intent}/units.md` + per-unit `unit-brief.md` |
| Stories | `memory-bank/intents/{intent}/units/{unit}/stories/` |
| Bolt instances | `memory-bank/bolts/{bolt-id}/bolt.md` |

## Handoff

At Checkpoint 4, on user approval: REQUIRED NEXT SKILL — invoke the `construction` skill. Do not start construction work inside this skill.
