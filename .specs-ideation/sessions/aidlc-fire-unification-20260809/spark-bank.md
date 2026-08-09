# Spark Bank — AI-DLC × FIRE Unification (Skills-Native)

**Session**: aidlc-fire-unification-20260809
**Topic**: Merging AI-DLC and FIRE into one skills-native flow — FIRE's dynamic runs as the core execution model; skills must not force steps.

**Grounding**: `memory-bank/research/aidlc-fire-unification-study.md` + user direction (2026-08-09): FIRE was "lite-aidlc" by intent; dynamic run grouping beats upfront bolt planning; skills-not-agents means no forced sequences.

---

## Batch 1

### S1-1 — FIRE-core, AI-DLC-overlay (asymmetric Option B)
Invert the study's symmetric-profiles recommendation. FIRE's model — intent → work item, dynamic runs, complexity × autonomy — **is** the unified core skill set. AI-DLC becomes a *methodology overlay plugin*: three-phase vocabulary, DDD stage depth, mob rituals, Operations phase, delivered as additional optional skills layered on the core. One engine to maintain, one state model, one test suite; AI-DLC fidelity lives entirely inside the overlay. Matches the observed reality: FIRE is the active product direction, AI-DLC is the methodology brand.

### S1-2 — Bolt types become run recipes (chosen at run time, not planning time)
Keep the study's key insight — stage catalog ≠ gate policy — but move the *choice* to execution. When a run starts, you (or the model, from complexity signals) pick a **recipe**: `default` (plan → execute → test → review), `ddd` (domain model → design → ADR → implement → test), `spike` (time-boxed explore → findings), `simple`. AI-DLC's bolt types survive intact as recipes — nothing is lost — but nobody designs execution containers during Inception anymore. Upfront planning shrinks to: intents, work items, dependencies. Grouping and ceremony are runtime decisions.

### S1-3 — Affordances, not pipelines (the skills-native enforcement model)
Delete "REQUIRED NEXT SKILL" chains. Each skill declares **preconditions** (what state must exist: e.g., `run-complete` requires a test report) and **postconditions** (what state it produces). The navigator/status skill reads state and *suggests* — never mandates — next moves. Enforcement moves from sequence-coercion to state-gating: you can invoke anything anytime; it tells you what's missing if it can't run. This is the only enforcement model that's honest about how skills actually work: descriptions route, state gates, nothing forces.

### S1-4 — One ceremony dial: autonomy bias × complexity everywhere
Retire per-bolt-type gate batteries (AI-DLC's 10–26 checkpoints per feature). The single gate policy across the unified flow is FIRE's matrix: complexity × autonomy bias → autopilot / confirm / validate. AI-DLC's "AI plans, human validates" is preserved as the **controlled** end of the dial — a preset, not a mandate. Even a `ddd` recipe run under `autonomous` bias flows gate-free; under `controlled` it gates every stage. Ceremony becomes a user posture, not a methodology decree.

### S1-5 — One flow, methodology presets, frozen legacy
Product/brand angle: ship a single **specsmd flow** with presets — `fire` (default), `aidlc` (AWS-faithful: three phases, upfront bolt planning available, full checkpoint battery), `simple`. New projects get one artifact root; the existing aidlc/fire flows are frozen as-is for current users (versioning decision already protects them). The AI-DLC preset is where CLAUDE.md fidelity rules apply; the default flow is free to be FIRE-shaped. Marketplace story simplifies: one core plugin + preset plugins, which the already-built plugin-per-flow boundaries can absorb.

---

## User decisions (2026-08-09, during session)

- **Recommendation ≠ enforcement**: creating bolts/runs via skills at any stage is NOT AI-DLC-incompatible. The flow *recommends* planning (navigator suggests), but users can always create containers during development. Skills enforce nothing; only scripts gate on state.
- **New single artifact root** for the unified flow; legacy roots stay frozen/supported for existing users.
- **Root is `docs/specsmd/`** — a *visible* docs folder, not a hidden dotfolder. Specs become part of the project's browsable documentation (renders on GitHub, greppable, reviewable in PRs), which fits the recommend-don't-hide philosophy.
- **Open**: container naming — bolt vs run vs other.

## Batch 2 — mechanics of recommend-don't-enforce

### S2-1 — Naming: "run" is the mechanism, "bolt" is the brand
Options on the table: (a) **run** everywhere — generic, matches agent/CI vocabulary, fits containers that batch multiple work items; keep "bolt" only in the aidlc terminology mapping. (b) **bolt** everywhere — the distinctive specsmd/AI-DLC brand word, evokes "hours or days" speed; redefine it as the dynamic container. (c) Split: a *run* executes one or more *bolts* — but two container words in one flow is the confusion we're merging to escape. Leaning (a) or (b) — pick one word, alias the other in docs.

### S2-2 — The recommended path lives in exactly three places
How to recommend without forcing, concretely: (1) the **navigator/status skill** computes "suggested next" from state — plan-shaped suggestions early, run-shaped later; (2) **skill descriptions** say "typically follows X" so model-invocation routing has the scent of the happy path; (3) **templates** show the ideal artifact progression. Scripts gate only on state prerequisites (no run completion without test report), never on phase or sequence. Nothing else exists to enforce with — and that's a feature to document, not hide.

### S2-3 — Upfront planning survives as draft runs
The aidlc-style `bolt-plan` skill doesn't die — it becomes optional **pre-grouping**: it writes *run proposals* (draft containers with suggested work-item groupings + recipe hints) into state. `run-start` offers: adopt a draft, regroup dynamically, or cherry-pick. Planned-ahead and grouped-on-the-fly become the same data structure at different times. AI-DLC users keep their inception ritual; FIRE users never see it.

### S2-4 — Phases become lenses, not modes
Inception/Construction/Operations stop being modes you enter and exit — they become **views over state**: what's still being shaped (intents/work items without runs), what's building (active runs), what's shipping (completed runs awaiting deploy/verify). The status skill reports through this lens; the three-phase vocabulary survives as orientation language while nothing about it gates anything. Sequential-phases fidelity holds *descriptively* (work does flow that way) without prescriptive walls.

### S2-5 — The new root, sketched
`docs/specsmd/` (user decision — visible docs folder, not a dotfolder): `state.yaml` (FIRE's engineered resumability — phases, checkpoints, resume tables, parallel runs array), `intents/{id}/` with work items, `runs/` (or `bolts/`), `standards/` with constitution + hierarchical monorepo overrides, `decisions/` (AI-DLC's ADR + "Read when" index — the one AI-DLC mechanism FIRE never got). One schema, one dashboard parser, one VS Code contract; recipes (ddd/spike/simple) are data files, not schema.

1. **Fidelity constraint scope**: CLAUDE.md mandates strict AWS AI-DLC adherence. If the unified default is FIRE-shaped, fidelity is preserved only *inside the aidlc preset/overlay*. Needs explicit user call — it redefines what "we are implementing AI-DLC" means for the product.
2. **Upfront bolt planning is in the AWS spec** (Inception produces bolt plans). Dynamic-only grouping deviates; keeping `bolt-plan` as an optional skill inside the aidlc preset resolves it.
3. **Artifact root**: one new root for the unified flow vs. keeping `memory-bank/` and `.specs-fire/` detection. Migration surface for dashboard, VS Code extension, flow-detect.
