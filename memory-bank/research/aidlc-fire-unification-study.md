# AI-DLC × FIRE — Unification Study

**Date**: 2026-08-06
**Status**: Input to Open Decision #6 of `memory-bank/ideas/skills-port-plan.md`
**Scope**: Feature-by-feature comparison of `src/flows/aidlc/` and `src/flows/fire/` to inform whether the two flows unify, share a core, or stay separate.

## TL;DR

The two flows are not two variants of the same design. They differ on **where truth lives** (AI-DLC: markdown frontmatter reconciled by scripts; FIRE: a central `state.yaml` that scripts own exclusively) and on **what determines ceremony** (AI-DLC: the bolt type chosen at planning time; FIRE: work-item complexity × a user-chosen autonomy bias). Beyond those two axes it is largely the same machine wearing different vocabulary.

The important non-code fact: **AI-DLC has had zero commits since 2026-01-24 (33 total); FIRE has 51 commits and is still changing as of 2026-03-08**. The docs' "choose a flow" page routes users to FIRE by default, and the newest flow (Ideation) copied FIRE's directory layout wholesale. FIRE is the de facto product direction; AI-DLC is the methodology brand.

**Recommendation: Option B** — shared core plus two thin methodology profiles, executed in phases that begin with work users never see. Full merge (A) is blocked by the AWS-fidelity constraint; staying separate (C) lets the duplication keep compounding — already at two state models, two integrity systems, two `project-init`s, two standards systems, two script sets, two dashboard parsers, and two hand-written schemas in the VS Code extension.

---

## 1. FIRE flow — full catalogue

### 1.1 Artifact model

Root is `.specs-fire/`. Hierarchy is **Intent → Work Item**, with **Run** as a *separate, orthogonal* execution container. A run can span multiple work items and even multiple intents — a structural difference from AI-DLC's bolt (always scoped to exactly one unit).

```
.specs-fire/
├── state.yaml                    # central source of truth
├── maintenance-log.md            # appended by integrity fixes
├── intents/{intent-id}/
│   ├── brief.md                  # id, title, status, created
│   └── work-items/
│       ├── {work-item-id}.md     # id, title, intent, complexity, mode, status, depends_on, created
│       └── {work-item-id}-design.md   # validate-mode only
├── runs/{run-id}/
│   ├── run.md                    # created by init-run.cjs
│   ├── plan.md                   # required in ALL modes, before implementation
│   ├── test-report.md            # required after tests pass
│   ├── review-report.md          # from code-review skill
│   └── walkthrough.md            # from walkthrough-generate skill
└── standards/
    ├── constitution.md           # ALWAYS from root, modules can NEVER override
    ├── tech-stack.md
    ├── coding-standards.md
    ├── testing-standards.md
    └── system-architecture.md
```

Monorepos add `{module-path}/.specs-fire/standards/` with **fallback-override semantics**: the file system is the registry, resolution walks up to the nearest ancestor, `constitution.md` exempt from override. `run-execute` implements discover → sort by path depth → resolve, "longest matching scope wins" per edited file.

Run IDs are `run-{worktree-token}-{NNN}` where `NNN` = `max(sequence in state.yaml, sequence on disk) + 1` — checking both sources so parallel worktrees and manually created folders can't collide.

### 1.2 State management

`.specs-fire/state.yaml` is the single source of truth. Schema:

- `project`: name, description, created, fire_version
- `workspace`: type (greenfield|brownfield), structure (monolith|monorepo|multi-part), autonomy_bias (autonomous|balanced|controlled), run_scope_preference (single|batch|wide), run_scope_history[] (last 10), scanned_at, parts[]
- `intents[]`: id, title, status, work_items[] with id, title, status (pending|in_progress|completed|blocked), complexity (low|medium|high), mode (autopilot|confirm|validate), depends_on[], plus run_id/completed_at on completion
- `runs.active[]` (**array — parallel runs by design**): id, scope, current_item, started, work_items[] each carrying id, intent, mode, status, **current_phase**, **checkpoint_state**, **current_checkpoint**
- `runs.completed[]`

**Resumability is the most engineered part of FIRE.** `current_phase` ∈ plan|execute|test|review (`update-phase.cjs`); `run-execute` has an explicit resume table (plan→step 3, execute→step 5, test→step 6, review→step 6b) and mandates deriving the resume point *from state.yaml, never from which artifact files happen to exist*. `checkpoint_state` ∈ awaiting_approval|approved|none|not_required (`update-checkpoint.cjs` normalizes ~15 synonyms).

**Hard phase guard**: `complete-run.cjs` refuses to complete an item whose `current_phase !== 'review'` (COMPLETE_051) and refuses a run if any item hasn't reached review (COMPLETE_060); `--force` overrides. Added because batch runs were being marked complete prematurely.

**Status cascade** is script-driven, one-directional: item status in state → mirrored to work-item frontmatter (best-effort; state.yaml wins on conflict) → derived intent brief status.

### 1.3 Agents and skills (3 agents, 11 skills)

**Orchestrator** (`/specsmd-fire`) — routes on verified state; "file system is source of truth, state.yaml may be incomplete."
- `project-init` — greenfield/brownfield detection, monorepo detection (nx/turbo/pnpm-workspace/lerna/rush/cargo/go.work + globs), **asks user for autonomy bias**, generates 5 standards from `.hbs` templates + per-module tech-stack.
- `route` — 5-branch decision tree: active run → Builder resume; pending items → Builder run-plan; intent without items → Planner decompose; no intents → Planner capture.
- `status` (v2.0.0) — status display **plus full integrity validator**: 15 typed issues w/ severity + auto-fixability; fix-all / review-each / skip / check-code modes; stale-run (>24h) and interrupted-run detection; frontmatter drift; logs to maintenance-log.md; never auto-fixes without asking.

**Planner** (`/specsmd-fire-planner`) — each skill declares "degrees of freedom" (HIGH/MEDIUM/LOW), a convention AI-DLC lacks.
- `intent-capture` (HIGH) — dialogue → brief.md.
- `work-item-decompose` (MEDIUM) — vertical slices, complexity assessment, **autonomy-bias matrix** maps complexity→mode, acceptance criteria, circular-dependency validation.
- `design-doc-generate` (LOW) — validate-mode only; decisions table, optional domain model, risks, implementation checklist. Checkpoint 1 of validate mode, **owned by Planner, not Builder**.

**Builder** (`/specsmd-fire-builder`)
- `run-plan` — scans disk, reconciles into state, offers three scopes, **learns the preference** (3 consistent choices → pre-select).
- `run-execute` — the core loop (below).
- `code-review` — runs the project's own linter with `--fix` (eslint/golangci-lint/ruff auto-detected), classifies AUTO-FIX vs CONFIRM (mechanical, non-semantic, trivially revertible, tests still pass) across 4 categories, re-runs tests after auto-fixes and **reverts if they break**, presents judgment calls per-item.
- `walkthrough-generate` — human-facing narrative, **no code**: structure, architecture pattern, domain model, decisions w/ rationale, **deviations from plan**, dependencies added, how-to-verify, gotchas.
- `run-status` — lightweight progress display.

### 1.4 Execution loop and gates

Fixed stage sequence; only the gate count varies by mode:

| Mode | Gates | Sequence |
|---|---|---|
| autopilot | 0 | init-run → load context → plan.md → implement → test → test-report → code-review → walkthrough → complete-run |
| confirm | 1 | + plan.md approval before implementing |
| validate | 2 | + design doc approved by Planner (CP1), then plan approved (CP2) |

Mode = complexity × autonomy_bias (balanced: low→autopilot / medium→confirm / high→validate; autonomous shifts down one; controlled shifts up one).

Two "⛔ HARD GATE" markers (init-run.cjs and complete-run.cjs must be invoked — no mkdir, no direct state edits); progress checklist; explicit batch-loop mandates.

### 1.5 Scripts, templates, config

Four `.cjs` scripts colocated under `agents/builder/skills/run-execute/scripts/`: `init-run.cjs` (single or `--batch` + `--scope`), `update-phase.cjs`, `update-checkpoint.cjs`, `complete-run.cjs` (`--complete-item`|`--complete-run`|`--force` + `--files-created`/`--files-modified`/`--decisions`/`--tests`/`--coverage`). All use the `yaml` npm package, structured error codes (INIT_0xx…) each with a suggestion string.

Twelve Handlebars templates, all colocated with their skill. Config is a single `memory-bank.yaml` (version 0.1.8) — **no `context-config.yaml`** (FIRE and Ideation both dropped it).

---

## 2. AI-DLC flow — catalogue (condensed)

Root `memory-bank/`. Hierarchy **Intent → Unit → Story**, with **Bolt** as execution container scoped to one unit; bolts in global flat `memory-bank/bolts/{BBB}-{unit-name}/`.

**State lives in frontmatter**, per artifact. `bolt.md`: status (planned|in-progress|complete|blocked), current_stage, stages_completed[], requires_bolts/enables_bolts/requires_units, complexity block (4 axes, 1–3). Stories: status, priority, assigned_bolt, implemented. Unit-briefs and requirements.md (doubles as intent status) carry their own status.

Cascade **bolt → stories → unit → intent** via `bolt-complete.cjs` (hard gate in bolt-start step 10), reconciled by `status-integrity.cjs [--fix]` (richer non-terminal rules, logs to maintenance-log.md). `artifact-validator.cjs [--json] [--fix]` checks naming, id↔filename, cross-references, timestamps.

**4 agents, 22 skills**: master (analyze-context, route-request, explain-flow, answer-question, project-init), inception (navigator, intent-create, intent-list, requirements, context, units, story-create, bolt-plan, review, vibe-to-spec), construction (navigator, bolt-list, bolt-start, bolt-status, bolt-replan, prototype-apply), operations (navigator, build, deploy, verify, monitor). A "navigator" is a zero-checkpoint routing menu where option 1 is always the computed next step.

**Gates**: Inception 4 (CP1 clarifying questions, CP2 requirements, CP3 all artifacts, CP4 ready-for-construction) with auto-continue between context→units→stories→bolt-plan. Construction: 1 for bolt selection + **one per bolt stage** (stage list from the bolt type). Operations: 4 (build, staging, production, monitoring), forbidden-to-skip environment progression.

**Bolt types are the pluggable execution unit**: `ddd-construction-bolt` (v2.0.0, 5 stages, source code forbidden in stages 1–2, ADRs registered in decision-index.md with "Read when" retrieval), `simple-construction-bolt` (3 stages, walkthrough artifacts, no-code rules), `spike-bolt` (2 stages, mandatory time_box, output is knowledge). Construction agent is bolt-type agnostic: "the bolt type IS the execution plan."

**Standards**: `templates/standards/catalog.yaml` — 6 standards with dependency ordering, per-standard decision lists, 5 project_types each specifying unit_structure per tier incl. decomposition strategy and default_bolt_type; conversational `*.guide.md` facilitation (3 referenced guides missing, documented fallback).

---

## 3. Side-by-side

| Dimension | AI-DLC | FIRE |
|---|---|---|
| Artifact root | `memory-bank/` | `.specs-fire/` |
| Hierarchy | Intent → Unit → Story | Intent → Work Item |
| Execution container | Bolt (1 unit, hours-or-days) | Run (1..N items, may cross intents) |
| Container namespace | Global `{BBB}-{unit}` | Global `run-{worktree}-{NNN}` |
| Source of truth | Artifact frontmatter | `state.yaml` (frontmatter mirrored) |
| Parallel execution | One bolt at a time in practice | `runs.active[]` array by design |
| Resumability | current_stage + stages_completed[] | current_phase + resume-point table + checkpoint_state |
| Completion guard | Script-only completion + anti-drift re-read guard | Script-only completion + phase guard rejecting non-review items |
| Ceremony driver | Bolt type (chosen at planning) | Complexity × autonomy bias (per item) |
| Gate count | ≈10–26 per feature | 0–2 per work item |
| Stage sequence | Pluggable per bolt type (5/3/2) | Fixed: plan → execute → test → review |
| Phases | Inception → Construction → Operations (AWS-mandated) | Plan → Execute (no operations) |
| Agents / skills | 4 / 22 | 3 / 11 |
| Skill layout | flat `skills/{phase}/*.md`, no frontmatter | `agents/<a>/skills/<s>/SKILL.md` + frontmatter |
| Templates | Plain .md, centralized | Handlebars .hbs, colocated |
| Scripts | 3 (`fs-extra`+`js-yaml`) | 4 (`yaml`) |
| Standards model | catalog.yaml + facilitation guides + project types | 5 .hbs + **constitution** + **hierarchical monorepo override** |
| Decision capture | ADRs + decision-index.md w/ "Read when" | Decisions tables in plan/walkthrough; no cross-run index |
| Code review | None | Dedicated skill (linter, auto-fix classification, revert-on-fail) |
| Integrity checking | CLI scripts | Interactive LLM skill (15 issue types, 4 modes) |
| Replanning | bolt-replan (append/split/reorder) | None |
| Greenfield/brownfield | Intent type field only | First-class workspace detection + brownfield rules |
| Monorepo | "Limited" per docs | First-class with inheritance |
| Config | memory-bank.yaml + context-config.yaml | memory-bank.yaml only |
| Activity | 33 commits, none since 2026-01-24 | 51 commits, active through 2026-03-08 |

---

## 4. Overlap analysis

Same capability, different name:

| Capability | AI-DLC | FIRE | Notes |
|---|---|---|---|
| Top-level goal | Intent | Intent | AI-DLC's is coarser (sits above units) |
| Leaf work unit | Story | Work Item | Both carry acceptance criteria; FIRE's coarser, carries complexity/mode |
| Execution container | Bolt | Run | Run ≈ a *batch of bolts* |
| Container log | bolt.md | run.md | Both script-created |
| Pre-implementation design | ddd-01 + ddd-02 | {item}-design.md | FIRE collapses two docs into one, validate-mode only |
| Implementation plan | implementation-plan.md (simple bolt) | plan.md (all modes) | |
| Test artifact | ddd-03-test-report / test-walkthrough | test-report.md | Nearly identical sections |
| Human-facing narrative | implementation-walkthrough.md | walkthrough.md | Same NO CODE rule; git log confirms direct borrowing (`2cc182b`) |
| Routing menu | navigator.md ×3 | route skill | |
| Project setup | project-init (catalog facilitation) | project-init (detection + autonomy) | Different philosophies, same job |
| Status + repair | status-integrity.cjs + analyze-context | status skill v2.0.0 | Same intent, opposite implementation |
| Progress phases | current_stage (from bolt type) | current_phase (fixed enum) | |
| Approval gate state | Implicit (LLM stops) | Explicit checkpoint_state in state.yaml | FIRE made it machine-readable for the dashboard |

`memory-bank/term-mappings.md` maps AI-DLC↔Agile only — no existing AI-DLC↔FIRE reconciliation. (Also: term-mappings says AI-DLC is "inherently iterative with three phases," contradicting `.claude/CLAUDE.md` rule 5 — sequential, NOT iterative.)

**No counterpart at all** — AI-DLC only: Operations phase (build/deploy/verify/monitor + environment progression), DDD stages, ADRs with cross-bolt retrieval, bolt-replan, standards catalog, spike bolts with time-boxing, story-level granularity + story-index, vibe-to-spec / prototype-apply. FIRE only: code review, monorepo hierarchical standards + constitution, autonomy bias, run scoping with preference learning, parallel runs, resume detection + phase guards, greenfield/brownfield detection, machine-readable checkpoint state.

**Key insight**: `bolt type` and `execution mode` are different axes. Bolt type = *which stages run*; mode = *how many approvals*. AI-DLC couples gates to stages; FIRE fixes the stages and decouples the gates. A unified model that separates "stage catalog" from "gate policy" expresses both cleanly.

---

## 5. Three unification options

### Option A — Full merge into one flow
One artifact root, one vocabulary; ceremony becomes a config knob.
- **Pros**: one runtime/test suite/dashboard parser/VS Code schema; every improvement lands for everyone.
- **Cons (one disqualifying)**: a single flow cannot simultaneously be faithful to the AWS AI-DLC spec and be low-ceremony. `.claude/CLAUDE.md` fixes three phases, mob rituals, DDD integration, and forbids modifying AI-DLC concepts. A merged flow either keeps the AI-DLC skeleton (imposing ceremony FIRE users chose to avoid) or drops it (no longer AI-DLC). Both user bases face migration (artifact roots are the flow-detection markers for `flow-detect.js`, dashboard `FLOW_CONFIG`, VS Code extension). The AI-DLC brand dissolves into a flag.

### Option B — Shared core + two thin methodology profiles ⭐ recommended
Extract one runtime engine; two profiles own vocabulary, hierarchy, stage catalogs, gate policy.
- **Engine owns**: state file + scripts (init/phase/checkpoint/complete), resume logic, completion phase guard, hierarchical standards resolution, integrity validation + maintenance log, code review, walkthrough generation, artifact validation.
- **Profile declares**: level names, container name, artifact root, id patterns, stage catalog, gate policy.
- Works because **both flows are the same state machine**: an ordered list of stages, each producing artifacts, each optionally gated. `plan(gate?)→execute→test→review` and `domain-model(gate)→technical-design(gate)→adr(gate,opt)→implement(gate)→test(gate)` are the same shape.
- **Carry-over**: AI-DLC keeps three phases, bolts, DDD stages, mob rituals, Operations — and *gains* resume, phase guards, code review, monorepo standards, interactive integrity (all methodology-neutral, none violating CLAUDE.md). FIRE keeps everything and can borrow ADR/decision-index and replanning.
- **Pros**: duplication actually goes away; both user bases keep artifact roots/vocabulary; AI-DLC fidelity preserved by construction. Fixes a real test gap: schema/consistency tests today run only against aidlc, behavioral script tests only against fire.
- **Cons**: real engineering with no immediate user-visible payoff; profile abstraction must cover pluggable stage catalogs AND the mode matrix (leaky-abstraction risk); `memory-bank.yaml` must become a *parsed* contract (today `installer.js` only copies it; nothing reads it).
- **User experience**: nothing changes day one; over time each flow gains the other's methodology-neutral capabilities, no migration, no renames.

### Option C — Stay separate
- **Pros**: zero risk, zero migration, fidelity trivially preserved.
- **Cons**: divergence already expensive and accelerating (two of everything, three hardcoded flow lists that already disagree about whether Ideation exists); AI-DLC — the methodology brand — is stagnant with none of FIRE's reliability work.

## 6. Recommendation

**Option B, phased, starting with work users never see:**

1. **Phase 1 (invisible)**: make `memory-bank.yaml` a parsed contract; collapse the three hardcoded flow lists (`constants.js` FLOWS / `flow-detect.js` SUPPORTED_FLOWS / dashboard FLOW_CONFIG) into one derived from it; unify dashboard frontmatter/status parsing behind it.
2. **Phase 2 (invisible)**: extract the run-state runtime — FIRE's four `.cjs` scripts generalized over `{artifact_root, state_path, container_name, id_pattern, stage_enum}` — and re-express `bolt-complete.cjs` against it (frontmatter cascade stays as a profile behavior).
3. **Phase 3 (visible, additive only)**: port FIRE's methodology-neutral skills into AI-DLC (code-review, interactive integrity status, resume detection + phase guard on bolt-complete, hierarchical monorepo standards + constitution) — none adds a phase, renames a concept, or changes bolt duration. Port AI-DLC's ADR + decision-index "Read when" retrieval into FIRE.
4. **Phase 4**: converge skill layout on `agents/<agent>/skills/<skill>/SKILL.md` (already the convention — Ideation adopted it) so all test suites run against every flow. This aligns exactly with the skills-port target layout.

**Explicitly do not**: merge artifact roots, rename hierarchy levels, or unify the two gate policies.

**Flagged methodology question (user call, not engineering)**: applying FIRE's `autonomy_bias` to AI-DLC's per-stage gates would reduce its 10–26 checkpoints but directly weakens "AI Plans, Human Validates" and the five named validation points. If done at all: opt-in, off by default.

---

## 7. Defects found along the way

**FIRE**
- `src/flows/fire/README.md` omits `run-plan` and `code-review` from the builder skill list and shows a flow-level `templates/{intents,runs,standards}/` tree that doesn't exist (templates are colocated per-skill).
- `agents/planner/agent.md:110-115` points at `templates/intents/*.hbs` paths that don't exist (correct paths are per-skill `./templates/*.hbs`).
- `walkthrough-generate/SKILL.md:32` reads work items as directories; they are files `{id}.md`.
- `run-execute` prerequisites run `npm install yaml` **in the user's project** — footgun for non-Node projects.
- `memory-bank.yaml` `version: "0.1.8"` / `project.fire_version` used for migration detection but hasn't tracked package version; confirm intentional.

**AI-DLC**
- `bolt-complete.cjs` indexes `process.argv['--last-stage']` (array by string) — flag permanently `undefined`.
- Status enum drift across three layers: story template `draft|ready|in-progress|implemented|tested|done` vs scripts writing `complete`; `review.md` writes `status: inception-complete` while `status-integrity.cjs` expects `units-defined|construction|complete` — a correctly completed inception reports as an inconsistency.
- Three orphaned assets referenced by nothing: `skills/inception/vibe-to-spec.md`, `skills/construction/prototype-apply.md`, `templates/construction/bolt-types/spike-bolt.md`.
- `catalog.yaml` references three nonexistent guide files (documented fallback exists).
- `operations-agent.md` points at `menu.md` (actual: `navigator.md`) and nonexistent `rollback.md`.
- `bolt-replan.md` hardcodes `ddd-construction-bolt` for appended bolts, bypassing unit-type resolution.
