---
name: release-verify
description: Use when a released change should be confirmed in a target environment. Records who or what confirmed which change, when, and what was observed. The record lives in the artifact tree.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: shipping
disable-model-invocation: true
---

# Verify a released change

Record confirmation of observable behavior. The confirmation is an artifact, not a chat reply. This step does not complete a bolt and does not gate anything.

## Collect

Ask for any that are missing:

- **change** — the released bolt id
- **who / what** — human name or agent name
- **when** — timestamp; omit to use now
- **environment** — where the behavior was observed
- **observation** — what a caller can see

The change must already appear on a release checklist.

## Write via script

Resolve `SCRIPTS_DIR` as the `scripts/` directory of the `flow-runtime` skill:

```text
node {SCRIPTS_DIR}/record-verify.cjs {projectRoot} --change {boltId} --by "{who}" --environment "{env}" --observation "{what}"
```

Optional: `--when {ISO}` `--release {releaseId}`.

If the script refuses, report the remediation and stop. Do not edit frontmatter.

## Close

Repeat who, what, when, environment, and which change. Offer at most three declinable next names. None is required.

Now exists:
- `docs/specsmd/releases/{releaseId}/verifications/{id}.md`

Declinable next (none required):
- `release-verify` — confirm another change
- `specsmd-status` — re-orient
- `release-checklist` — another set of completed bolts
