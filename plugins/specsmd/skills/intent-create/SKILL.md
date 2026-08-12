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

Capture problem, outcome, scope, and non-goals. No mechanism, no file names, no code.

## Dialogue

Ask only what is still missing. Summarize and confirm before writing.

Required sections of the brief: **problem**, **outcome**, **scope**, **non-goals**. Additional sections are allowed. If the user gives one line, write the brief anyway and say which sections are thin.

If unlinked work items already exist, ask which belong to this intent. Record `intent: {id}` only on the ones the user confirms. The flow does not auto-link.

## Write via script

Resolve `SCRIPTS_DIR` as the `scripts/` directory of the `flow-runtime` skill. Write the body to a temp file, then:

```text
node {SCRIPTS_DIR}/init-intent.cjs {projectRoot} --title "{title}" --body-file {temp}
```

Do not create the markdown yourself. Use `references/brief.md` as the body shape.

## Close

List the artifact that now exists. Offer — without requiring — `work-item-decompose`. Do not invoke it. Do not say a next skill is required.
