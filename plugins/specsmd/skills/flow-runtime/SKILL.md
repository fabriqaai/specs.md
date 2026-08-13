---
name: flow-runtime
description: Use when you need to mutate specsmd artifact state or read the flow contract. Owns the state scripts; other skills invoke those scripts rather than editing frontmatter.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: runtime
disable-model-invocation: true
---

# Flow runtime

This skill is the only writer of artifact **state** (frontmatter fields listed in `references/flow-contract.yaml`). Skills and humans may write artifact bodies (`plan.md`, intent prose, walkthroughs). They must not edit status fields by hand.

## Scripts

Resolve `SCRIPTS_DIR` as this skill's `scripts/` directory. Invoke with the project root first. Success JSON is on stdout. Failures are typed: retryable (exit 1), terminal (2), structural (3). The `remediation` field is what to do next.

| Script | Purpose |
|---|---|
| `scripts/init-project.cjs` | Create the artifact tree |
| `scripts/init-intent.cjs` | Write an intent brief |
| `scripts/init-work-item.cjs` | Write a work item; refuse cycles |
| `scripts/relink-work-item.cjs` | Move pending items onto an intent |
| `scripts/init-bolt.cjs` | Create a bolt or `--draft` |
| `scripts/update-stage.cjs` | Record a stage complete |
| `scripts/update-checkpoint.cjs` | Record a gate decision |
| `scripts/complete-bolt.cjs` | Complete a bolt; cascade status; surface matching `system/` docs (`--touched-scope`, `--reviewed`, `--skip-review`) |
| `scripts/init-system-doc.cjs` | Register a semantic `system/` document (`--claimed-scope`, `--facts-json`, `--claims-json`) |
| `scripts/init-decision.cjs` | Record a decision and add it to the in-force index |
| `scripts/supersede-decision.cjs` | Replace an in-force decision (new record + index + old pointer) |
| `scripts/archive-artifact.cjs` | Move an episodic record to `archive/` (refused while truth is uncaptured; never archives semantic docs) |
| `scripts/garden.cjs` | Memory gardening pass; repair only with `--fix` or `--finding` |
| `scripts/init-release.cjs` | Write a release checklist over completed bolts |
| `scripts/record-verify.cjs` | Record who/what/when confirmed a released change |
| `scripts/validate-integrity.cjs` | Detect drift; repair only with `--fix` or `--finding` |
| `scripts/status.cjs` | Read-only lenses (runs the validator without `--fix`) |
| `scripts/resolve-standards.cjs` | Resolve the standard set for a file |
| `scripts/record-standards.cjs` | Record confirmed standard proposals |
| `scripts/report-violation.cjs` | Phrase a violation as a remediation |

`validate-integrity.cjs` prints the same JSON envelope as the other scripts. Findings include `severity`, `auto_repairable`, and a remediation that names what to change and where. `--fix` consents to every auto-repairable finding; `--finding F1` consents to one; `--interactive` walks auto-repairable findings on a TTY (refuses a non-TTY). `--stale-after` overrides the contract default (`P7D`). Every applied repair is appended to `docs/specsmd/maintenance-log.md`. A clean tree exits 0 with zero findings. `status.cjs` calls the same detector read-only and exposes the findings as `health`. Completing a bolt with matching `system/` documents left unreviewed adds an advisory `UNREVIEWED_PROJECTION` finding (never a completion blocker). `garden.cjs` is the memory pass: contradictions, stale index entries, missing upward pointers, past-horizon episodic still hot. Horizon starts when the record became episodic (historical-header date, then `completed`, then `created`). It changes nothing without `--fix` / `--finding`.

`init-system-doc.cjs` registration fields are `name`, `purpose`, `claimed_scope`. Optional `--facts-json '{"provider":"oauth"}'` and `--claims-json '[{"path":"src/auth.js","contains":"oauth"}]'` make gardening checkable. Claims are explicit file assertions; facts without claims are checked against source files named after `claimed_scope`. Contradictions are never auto-repaired. `archive-artifact.cjs` moves only episodic records; `--force` overrides uncaptured-truth gates, not semantic current truth. Archiving an intent moves `intents/{id}/` (brief + work items).

Never install packages into the user's project. These scripts have no dependencies.

## Contract

`references/flow-contract.yaml` is the single source for locations, identifiers, status tokens, and the ceremony matrix. `references/recipes/` holds the four shipped recipes (`default.yaml`, `ddd.yaml`, `spike.yaml`, `simple.yaml`). `references/standards/` holds the shipped standard templates (invariant, enforcement tier, remediation). A bolt stores `recipe` plus an immutable `recipe_snapshot` at creation.
