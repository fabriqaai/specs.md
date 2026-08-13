# specsmd flow — skill-owned state

The memory bank is `docs/specsmd/`. There is no `state.yaml` and no `memory-bank/` for this flow.

Skills write artifact files and their YAML frontmatter. There are no state scripts.

## Status

Legal values: `draft` | `pending` | `active` | `complete` | `abandoned`.

Never write `in-progress`, `completed`, or `done`.

| From | To | Skill |
|---|---|---|
| (none) | `pending` | `intent-create`, `work-item-decompose` |
| (none) | `draft` | `bolt-plan` |
| `draft` | `active` | `bolt-start` (adopt) |
| `draft` | `abandoned` | `bolt-start` (adopt consumes the draft) |
| `pending` | `active` | `bolt-start` (items named on the new bolt) |
| `active` | `complete` | `bolt-execute` (bolt, then cascade items, then intent if all items terminal) |
| any non-terminal | `abandoned` | any shaping skill when the user abandons the work |

## Bolt fields the execute skill maintains

- `current_stage` — id of the stage in progress; `null` when complete
- `stages_completed` — list of `{name, completed}`
- `checkpoint_state` — `none` | `awaiting` | `granted` | `not-required`
- `recipe` and `recipe_snapshot` — set at start, never changed

Resume from those fields. Do not infer the stage from which files exist.

## Dynamic grouping (FIRE flexibility)

At `bolt-start`, calculate three offers from pending (unbolted) work items:

1. **Single** — one item
2. **Batch** — items that share ceremony (or that the user names)
3. **Wide** — all compatible pending items, dependency order, one bolt

Recommend from autonomy bias (`autonomous` → wide, `controlled` → single, `balanced` → batch if more than two items). Remember the last three choices in `docs/specsmd/project.md` under `grouping_history` and pre-select after three matches. The user may ignore the recommendation. Draft bolts from `bolt-plan` stay optional.

## Cascade on bolt complete

1. Bolt → `complete`, `current_stage: null`, stamp `completed`
2. Each named work item → `complete` (or leave as-is if the user marks it still open)
3. Intent → `complete` only when every work item on that intent is `complete` or `abandoned`

If required evidence is missing (recipe `completion_requires`, walkthrough with deviations, gating DoD unchecked), do not complete. Say what is missing. Do not invent a script error code.

## Ceremony (AI plans, human validates)

Read `ceremony.gates` from `flow-contract.yaml`.

- `autopilot` — no wait
- `confirm` — wait on the recipe's first gateable stage
- `validate` — wait on every gateable stage

Waiting means: write the stage artifacts, emit their **full current text** (not a summary), and stop until the user approves. Then set `checkpoint_state: granted` and advance `current_stage`.
