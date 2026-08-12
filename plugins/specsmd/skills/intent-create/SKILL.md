---
name: intent-create
description: Use when the user wants to start something new and no intent captures it yet. Turns a dialogue into an intent brief under docs/specsmd/.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: planner
disable-model-invocation: true
---

# Create an intent

Capture **problem**, **outcome**, **scope**, and **non-goals**. No mechanism, no implementation file names, no code. This skill is invocable at any time, including after work items already exist.

## Dialogue

Ask only what is still missing. Summarize and confirm before writing.

Required sections of the brief: **problem**, **outcome**, **scope**, **non-goals**. Additional sections are allowed. If the user gives one line, write the brief anyway and say which sections are thin.

Follow `references/nlspec.md` in the `flow-runtime` skill — the intent register is pure intent. If two readings are interchangeable to a caller, pick one and name it. If they are not interchangeable, ask. Never silently pick a side of a contradiction.

If work items already exist, ask which belong to this intent. After the user confirms, relink only those **pending** items with the script below. The script refuses items that are not pending or that are named on a non-draft bolt. New items created later under this intent are also a link. The flow does not auto-link.

## Write via script

Resolve `SCRIPTS_DIR` as the `scripts/` directory of the `flow-runtime` skill. Write the body to a temp file using `references/brief.md` as the shape, then:

```text
node {SCRIPTS_DIR}/init-intent.cjs {projectRoot} --title "{title}" --body-file {temp}
node {SCRIPTS_DIR}/relink-work-item.cjs {projectRoot} --intent {id} --work-items {id,id}
```

The relink line runs only after the user confirms membership. Do not create the markdown yourself. Do not edit status fields.

## Close

List the artifacts that now exist. Offer at most three declinable next names. None is required. Do not invoke them. Do not say a next skill is required.

Now exists:
- `docs/specsmd/intents/{id}/brief.md`
- relinked work items, if the user confirmed any

Declinable next (none required):
- `work-item-decompose` — slice this intent
- `bolt-plan` — optionally pre-group existing items
- `specsmd-status` — re-orient
