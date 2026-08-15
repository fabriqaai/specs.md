---
name: task-decompose
description: Use after an intent brief's outcome is captured, when the next work is writing or extending that intent's tasks.md slices — before bolt-design, or to add slices later.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: planner
disable-model-invocation: true
---

# Decompose tasks

Turn an intent into vertical slices in that intent's `tasks.md`. Each slice is independently valuable observable behavior, not a layer (not "the schema" then "the API" then "the UI").

Call this when the brief states the outcome clearly enough to slice. Write `tasks.md`. Then `bolt-design` groups those slices. Call it again to add slices.

Follow `references/nlspec.md` in the `flow-runtime` skill (task / work-item register). Read the owning brief first. Do not contradict its outcome or Definition of Done. If two readings are interchangeable to a caller, pick one and name it. If they are not, ask.

## Assess

Complexity is decision load, not file count:

- `low` — no new correctness or interoperability decisions
- `medium` — local decisions inside an existing shape
- `high` — new cross-cutting decisions

Default complexity when unstated: `medium`.

Suggested ceremony comes from `ceremony.matrix` in `references/flow-contract.yaml` in the `flow-runtime` skill (complexity × the project's autonomy bias). Unset bias is `balanced`. Record the result as `ceremony_suggested`. The user may override it later at bolt start. Do not copy the matrix into the task section.

## Acceptance criteria

Every task section ends in a Definition of Done. Criteria are behavioral and marked `(gating)` or `(advisory)`. An internal-attribute criterion (names a module, function, or "add a validator") is flagged on that line as `flag: internal-attribute` and does not block writing. If the slice has a caller, close or name the hunts in `references/caller-contracts.md` in the `flow-runtime` skill on that section.

Use `references/task.md` as the **section** shape. All slices for one intent live in one file.

## Write

Create or append `docs/specsmd/intents/{intentId}/tasks.md`. If the file does not exist, start it with `# Tasks` and a checkable list. Each slice is one checkbox in that list **and** a `## {nnn}-{slug}` section below.

```markdown
# Tasks

- [ ] [{id}](#{id}) — {title}

## {id}
```

`- [ ]` means not complete. `- [x]` means `status: complete`. Keep the list and the `status:` line in sync. Next `{nnn}` is global across all intents (highest existing + 1). Do not create a file per slice.

Section metadata (plain `key: value` lines under the heading, not a second frontmatter fence):

```text
id: {nnn}-{slug}
title: {title}
intent: {intentId}
complexity: low|medium|high
ceremony_suggested: autopilot|confirm|validate
status: pending
depends_on: []
created: {ISO-8601}
```

Refuse a dependency cycle: if A depends on B and B on A, write nothing for that item and name the cycle as an ordered id list.

## Close

List the task sections that now exist. Offer at most three declinable next names. None is required. Do not invoke them.

Now exists:
- `docs/specsmd/intents/{intentId}/tasks.md` (new or updated sections; `ceremony_suggested` recorded)

Declinable next (none required):
- `bolt-design` — start a bolt on this intent
- `plan-intent` — capture another outcome
- `specsmd-status` — re-orient
