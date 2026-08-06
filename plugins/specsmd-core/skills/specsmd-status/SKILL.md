---
name: specsmd-status
description: Use when the user asks where the project stands, what to do next, or which specsmd flow is active — or when you need to route to the right flow skill and the project state is unclear. Reads project artifacts and recommends the next step.
license: MIT
metadata:
  version: "1.0.0"
  flow: core
  phase: navigator
---

# specsmd Status & Navigator

Determine project state from the file system, report it, and recommend the next skill. The file system is the source of truth — never infer state from conversation memory.

## Process

### 1. Detect installed flows

Check for artifact roots in the project:

| Artifact root | Flow | State source |
|---|---|---|
| `memory-bank/` | AI-DLC | Frontmatter of artifacts + roll-up logs |
| `.specs-fire/` | FIRE | `.specs-fire/state.yaml` |
| `.specs-ideation/` | Ideation | `sessions/*/session.yaml` |
| `specs/` | Simple | Phase files present |

If none exist, the project is uninitialized: recommend the flow's init skill (`aidlc-init`, `fire-init`) or the flow entry skill, based on which plugins are installed and what the user wants.

### 2. Read state (per detected flow)

**AI-DLC** (`memory-bank/`):
- Standards exist under `memory-bank/standards/`? If not → recommend `aidlc-init`.
- List intents (`memory-bank/intents/*/requirements.md` frontmatter `status`).
- For in-progress intents: units defined? stories created? bolts planned (`memory-bank/bolts/`)?
- Bolt states from `memory-bank/bolts/*/bolt.md` frontmatter (`status`, `current_stage`, `stages_completed`).
- Roll-ups: `story-index.md`, per-unit `construction-log.md`, per-intent `inception-log.md`.

**FIRE** (`.specs-fire/state.yaml`): active runs (with `current_phase` and `checkpoint_state`), pending work items, intents without work items.

**Ideation**: sessions with `phase != complete`.

**Simple**: which of requirements/design/tasks exist under `specs/` and whether tasks are done.

### 3. Report

Present a concise status: what exists, what is in progress (with its exact position — stage, checkpoint, or chain step), what is blocked, what comes next. Use plain lists, not tables of paths.

### 4. Recommend

End with one primary recommendation — the single next skill to invoke and why — plus at most two alternatives. Route by state, not by user guesses:

- Uninitialized → the flow's init skill
- No intents / no work captured → the flow's intent skill (`intent-create`, `intent-capture`)
- Inception artifacts incomplete → `inception` (AI-DLC) to resume its chain
- Bolts planned but not started / active run paused → `construction` / `fire` to resume execution
- All construction complete → `operations` (AI-DLC)
- Multiple flows detected → ask which one the user wants to work in

## Constraints

- Read-only: this skill never creates or modifies artifacts.
- If state files contradict each other (frontmatter vs roll-up logs), report the inconsistency instead of silently picking one; AI-DLC projects can repair with the integrity script bundled with the `bolt-start` skill.
