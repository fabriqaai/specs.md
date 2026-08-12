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
| `scripts/init-bolt.cjs` | Create a bolt or `--draft` |
| `scripts/update-stage.cjs` | Record a stage complete |
| `scripts/update-checkpoint.cjs` | Record a gate decision |
| `scripts/complete-bolt.cjs` | Complete a bolt; cascade status |
| `scripts/validate-integrity.cjs` | Detect drift; repair only with `--fix` or `--finding` |
| `scripts/status.cjs` | Read-only lenses (runs the validator without `--fix`) |

`validate-integrity.cjs` prints the same JSON envelope as the other scripts. Findings include `severity`, `auto_repairable`, and a remediation that names what to change and where. `--fix` consents to every auto-repairable finding; `--finding F1` consents to one. `--stale-after` overrides the contract default (`P7D`). Every applied repair is appended to `docs/specsmd/maintenance-log.md`. A clean tree exits 0 with zero findings. `status.cjs` calls the same detector read-only and exposes the findings as `health`.

Never install packages into the user's project. These scripts have no dependencies.

## Contract

`references/flow-contract.yaml` is the single source for locations, identifiers, status tokens, and the ceremony matrix. `references/recipes/` holds the four shipped recipes (`default.yaml`, `ddd.yaml`, `spike.yaml`, `simple.yaml`). A bolt stores `recipe` plus an immutable `recipe_snapshot` at creation.
