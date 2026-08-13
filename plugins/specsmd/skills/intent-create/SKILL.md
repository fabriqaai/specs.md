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

Capture **problem**, **outcome**, **scope**, and **non-goals**. No mechanism, no implementation file names, no code. Invocable at any time.

## Dialogue

Ask only what is still missing. Summarize and confirm before writing.

Required sections of the brief: **problem**, **outcome**, **scope**, **non-goals**. Additional sections are allowed. If the user gives one line, write the brief anyway and say which sections are thin.

Follow `references/nlspec.md` in the `flow-runtime` skill. If two readings are interchangeable to a caller, pick one and name it. If they are not interchangeable, ask.

If work items already exist, ask which belong to this intent. Relink only **pending** items (move the file under this intent's `work-items/` and set `intent:`). Refuse items that are not pending or that are named on a non-draft bolt.

## Write

Create `docs/specsmd/intents/{nnn}-{slug}/brief.md` using `references/brief.md` in this skill. Next id is one more than the highest `{nnn}` already under `intents/`.

Frontmatter:

```yaml
id: {nnn}-{slug}
title: {title}
status: pending
created: {ISO-8601}
```

Write the file. Do not require a script.

## Close

List the artifacts that now exist. Offer at most three declinable next names. None is required. Do not invoke them.

Now exists:
- `docs/specsmd/intents/{id}/brief.md`

Declinable next (none required):
- `work-item-decompose` — slice this intent
- `bolt-plan` — optionally pre-group existing items
- `specsmd-status` — re-orient
