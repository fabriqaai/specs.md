---
id: 002-unified-flow-pr-plan
status: active
created: 2026-08-13
consult_when: executing the unified bolt flow implementation, PR order, what full v1 includes
---

# Design — Unified Bolt Flow implementation

Stack parent is **`main-v2`**, not `main`. `main` is frozen v1.

Specs: `docs/specsmd/intents/001-unified-bolt-flow/tasks.md` and `docs/specsmd/standards/nlspec.md`. The flow contract, once landed, is the single source for locations, status tokens, and the ceremony matrix.

Status vocabulary: `draft | pending | active | complete | abandoned`. No `in-progress`.

Skills never enforce sequence. Scripts gate on state only. No `state.yaml`. No competitor names.

A reference foundation exists on branch `wip/unified-foundation` (thin plugin: `plugins/specsmd/`, contract, default recipe, state scripts, marketplace). Implementers may read it with `git show wip/unified-foundation:<path>` and must expand it to the full DoD — do not ship the dogfood-only freedoms (default-only recipes, no snapshot, no integrity, no evals).

## PR Plan

### PR 1: Evals and verifiers

**Description:** Land work item `000-flow-evals`. Create top-level `evals/` with sufficiency-check runner (high = triangulation protocol; medium/low = adversarial review), recorded pass/fail on the work item (`sufficiency: cleared | not-cleared` plus report path), DoD conformance checker with verified/failed/needs-human coverage, trigger-eval fixtures for `using-specsmd` and `specsmd-status`, and a CI/pre-merge check that rejects a contribution that touches both flow implementation (`plugins/specsmd/**`) and `evals/**`. Implementing agents must not write `evals/`.

**Files/components affected:** evals/, .github/workflows/ or a test in src/__tests__ that enforces holdout isolation, docs/specsmd/intents/001-unified-bolt-flow/tasks.md#000-flow-evals

**Dependencies:** None

### PR 2: Flow contract, four recipes, state scripts

**Description:** Land work items `001-flow-schema`, `002-recipe-catalog`, and `003-state-scripts` in full. One machine-readable contract; artifact root `docs/specsmd/`; all four recipes (`default`, `ddd`, `spike`, `simple`) as data with per-stage produces/gateable/constraints; complexity→recipe mapping (low→simple, medium→default, high→ddd); snapshot the recipe onto the bolt at create; spike time box expires into findings via the complete operation; goal-gated complete with remediation; cascade bolt→work items→intent; collision-safe bolt ids; typed errors (retryable/terminal/structural); resume from `current_stage` + `checkpoint_state`. Tests cover every gating DoD box that is machine-checkable. Reuse `wip/unified-foundation` as a starting point and remove dogfood-only shortcuts.

**Files/components affected:** plugins/specsmd/skills/flow-runtime/, src/__tests__/unit/unified/, docs/specsmd/intents/001-unified-bolt-flow/tasks.md#001-flow-schema, docs/specsmd/intents/001-unified-bolt-flow/tasks.md#002-recipe-catalog, docs/specsmd/intents/001-unified-bolt-flow/tasks.md#003-state-scripts

**Dependencies:** PR 1

### PR 3: Integrity validator

**Description:** Land work item `004-integrity-validator`. Detect cascade drift, orphaned references, stale active bolts (configurable threshold with a default), illegal status tokens, and id/location mismatches. Findings have severity, auto-repairable flag, and remediation. No repair without consent (`--fix` / per-finding). Repairs append a maintenance log. Non-interactive clean tree exits 0 with zero findings.

**Files/components affected:** plugins/specsmd/skills/flow-runtime/scripts/validate-integrity.cjs, plugins/specsmd/skills/flow-runtime/SKILL.md, src/__tests__/unit/unified/integrity.test.ts, docs/specsmd/intents/001-unified-bolt-flow/tasks.md#004-integrity-validator

**Dependencies:** PR 2

### PR 4: Planning, execution, and navigator skills

**Description:** Land work items `005-planning-skills`, `006-execution-skills`, and `007-navigator-status` in full. Skills: `intent-create`, `work-item-decompose`, `bolt-plan`, `bolt-start`, `bolt-execute`, `walkthrough-generate`, `specsmd-status`, `using-specsmd`. By-name only except bootstrap + navigator. Ceremony table and gate matrix as specified. Genuine review = full plan text in the approval turn. Walkthrough on every completed bolt, no language-tagged code. Navigator is read-only, suggestion order G>I>H>C>P>D>S>E, never writes or invokes. No REQUIRED NEXT SKILL.

**Files/components affected:** plugins/specsmd/skills/, src/__tests__/plugins-validation.test.ts, docs/specsmd/intents/001-unified-bolt-flow/tasks.md#005-planning-skills, docs/specsmd/intents/001-unified-bolt-flow/tasks.md#006-execution-skills, docs/specsmd/intents/001-unified-bolt-flow/tasks.md#007-navigator-status

**Dependencies:** PR 2

### PR 5: Standards system

**Description:** Land work item `008-standards-system`. Constitution never overridden. Nearest-scope resolution in a monorepo. Init asks exactly one question (autonomy bias); detects greenfield vs existing and single vs monorepo; inferred standards in an existing codebase are confirmed before recording. Templates state invariant, enforcement tier, and remediation phrasing.

**Files/components affected:** plugins/specsmd/skills/specsmd-init/, plugins/specsmd/skills/flow-runtime/references/standards/, plugins/specsmd/skills/flow-runtime/scripts/, src/__tests__/unit/unified/standards.test.ts, docs/specsmd/intents/001-unified-bolt-flow/tasks.md#008-standards-system

**Dependencies:** PR 2

### PR 6: Memory lifecycle

**Description:** Land work item `011-memory-lifecycle`. Memory class derived from status (change records semantic while non-terminal, episodic when terminal). Completing a bolt surfaces matching `system/` documents for review (advisory). Episodic artifacts get a historical header and one-hop upward pointer. Decisions index is the in-force list; supersede updates index + old pointer. Archive refused while uncaptured truth remains. Gardening pass reports contradictions with remediation, changes nothing without consent.

**Files/components affected:** plugins/specsmd/skills/flow-runtime/, plugins/specsmd/skills/using-specsmd/SKILL.md, plugins/specsmd/skills/specsmd-status/SKILL.md, src/__tests__/unit/unified/memory.test.ts, docs/specsmd/intents/001-unified-bolt-flow/tasks.md#011-memory-lifecycle

**Dependencies:** PR 2, PR 3

### PR 7: Slim release step

**Description:** Land work item `012-slim-ops`. Release checklist over completed bolts (changes, evidence, outstanding findings, relevant decisions). Verify step records who/what/when against which change. Shipping lens distinguishes completed-unreleased from released. Projects that never release get no release findings.

**Files/components affected:** plugins/specsmd/skills/, src/__tests__/unit/unified/release.test.ts, docs/specsmd/intents/001-unified-bolt-flow/tasks.md#012-slim-ops

**Dependencies:** PR 4

### PR 8: Plugin packaging

**Description:** Land work item `009-plugin-packaging`. Self-contained `specsmd` plugin (bootstrap + navigator included). Repo-root `.claude-plugin/marketplace.json` with `pluginRoot: "./plugins"`. Plugin-format validation passes. Trigger evals from PR 1 pass against shipped descriptions. Legacy plugin validation identical. Decision `001-self-contained-plugin` remains the rejected-alternative record. Manual install path documented in-plugin.

**Files/components affected:** plugins/specsmd/, plugins/.claude-plugin/marketplace.json, .claude-plugin/marketplace.json, src/__tests__/plugins-validation.test.ts, docs/specsmd/intents/001-unified-bolt-flow/tasks.md#009-plugin-packaging

**Dependencies:** PR 1, PR 4, PR 5

### PR 9: v2 documentation

**Description:** Land work item `010-v2-docs`. Add `/v2` section on the Mintlify site (quickstart, concepts, recipes, skills, nlspec, manual install, coming-from-v1 mapping). Do not break any existing URL. Version switcher visible from both homes. No competitor names.

**Files/components affected:** docs.specs.md/v2/, docs.specs.md/docs.json, docs.specs.md/index.mdx, docs/specsmd/intents/001-unified-bolt-flow/tasks.md#010-v2-docs

**Dependencies:** PR 8
