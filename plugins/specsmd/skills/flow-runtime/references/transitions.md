# specsmd flow — skill-owned state

The memory bank is `docs/specsmd/`. There is no `state.yaml` and no `memory-bank/` for this flow.

Skills write artifact files and their YAML frontmatter. There are no state scripts.

## Status

Legal values: `draft` | `pending` | `active` | `complete` | `abandoned`.

Never write `in-progress`, `completed`, or `done`.

| From | To | Skill |
|---|---|---|
| (none) | `pending` | `plan-intent`, `task-decompose` |
| (none) | `draft` | `bolt-design` |
| `draft` | `active` | `bolt-design` (adopt) |
| `draft` | `abandoned` | `bolt-design` (adopt consumes the draft) |
| `pending` | `active` | `bolt-design` (items named on the new bolt) |
| `active` | `complete` | `bolt-execute` (bolt, then cascade items, then intent if all items terminal) |
| any non-terminal | `abandoned` | any shaping skill when the user abandons the work |

## Bolt fields the execute path maintains

- `intent` — owning intent; never another intent's work items
- `current_stage` — id of the stage in progress; `null` when complete
- `stages_completed` — list of `{name, completed}`
- `checkpoint_state` — `none` | `awaiting` | `granted` | `not-required`
- `recipe` and `recipe_snapshot` — set at start, never changed

Resume from those fields. Do not infer the stage from which files exist.

A bolt lives at `docs/specsmd/intents/{intent}/bolts/{id}/`. It is scoped to one intent.

## Dynamic grouping (FIRE flexibility)

At start, calculate three offers from pending (unbolted) work items **on the chosen intent**:

1. **Single** — one item
2. **Batch** — items that share ceremony (or that the user names)
3. **Wide** — all compatible pending items on this intent, dependency order, one bolt

Refuse a set that names work items from more than one intent. Name both intents.

Recommend from autonomy bias (`autonomous` → wide, `controlled` → single, `balanced` → batch if more than two items). Remember the last three choices in `docs/specsmd/project.md` under `grouping_history` and pre-select after three matches. The user may ignore the recommendation. Draft bolts stay optional.

## Cascade on bolt complete

1. Bolt → `complete`, `current_stage: null`, stamp `completed`
2. Each named work item → `complete` (or leave as-is if the user marks it still open)
3. Intent → `complete` only when every work item on that intent is `complete` or `abandoned`

If required evidence is missing (recipe `completion_requires`, walkthrough with deviations, gating DoD unchecked), do not complete. Say what is missing. Do not invent a script error code.

## Ceremony (AI plans, human validates)

Read `ceremony.gates` and `ceremony.applies_to` from `flow-contract.yaml`. Gates apply only to **design-class** stages (id or produced file listed under `ceremony` in that file). `bolt-execute` never waits.

- `autopilot` — no wait
- `confirm` — wait on the first gateable design stage
- `validate` — wait on every gateable design stage

Waiting means: write the stage artifacts, emit their **full current text** (not a summary), and stop until the user approves. Then set `checkpoint_state: granted` and advance `current_stage`.

Invoking `bolt-execute` is the go-ahead. That skill runs remaining implement stages without confirmation.
