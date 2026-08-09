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

---

## Batch 3 — memory lifecycle (episodic vs semantic, 2026-08-09)

User direction: treat episodic and semantic memory differently in specsmd outputs — episodic can be deleted over time (models re-derive trajectories), semantic must be kept true forever.

### S3-1 — Memory class as contract data
Every artifact type in the flow contract declares its memory class — exactly two: **semantic** (specs, standards, constitution, decisions, glossary — never expires, drift-managed) and **episodic** (bolt plans, test/review reports, walkthroughs, surprises, maintenance-log entries, eval reports — retention horizon). Lifecycle policy is data, like recipes. *User decision 2026-08-09: no third "procedural" class — skills/recipes are specsmd itself, managed by coding agents; the memory model governs only what specsmd manages.*

### S3-2 — Distillation-gated forgetting (the goal gate for deletion)
An episodic record may be pruned only after its semantic residue is captured: decisions → decision records with "read when" hints; surprises → spec corrections or standards updates; recurring corrections → guardrail promotion (the escalation ladder). Pruning is refused while residue is missing — same structural pattern as goal-gated completion. The nlspec vacuum-artifact rule IS the distillation law: the spec says "X", never "we discovered X".

### S3-3 — Git history is the episodic archive
Nothing is truly deleted: `docs/specsmd/` is versioned, so pruning removes artifacts from the *working tree* (= the agent's reachable context) while git history retains the full trajectory. "Anything the agent can't access in-context effectively doesn't exist" — inverted into a feature: forgetting = removing from context-reachable space, not destroying evidence. Bolt frontmatter (tiny) can persist as an index entry; heavyweight trajectory artifacts get pruned.

### S3-4 — Semantic freshness as a recurring flow
Semantic memory earns its permanence by being kept true: doc-gardening/spec-drift detection runs recurringly, each semantic doc carries a verification status and temporal anchors ("at the time of writing…"), and stale semantic content is a finding with a remediation — a wrong permanent memory is worse than a deleted temporary one.

### S3-5 — The economics justification
Episodic deletion is safe *because* code+specs are regenerable: the trajectory (how it was done) is re-derivable by a capable model from the semantic layer (what is true + why). What is NOT re-derivable is exactly what semantic memory holds: decisions among valid options, rationale, constraints. Delete the how, keep the which-and-why. Stale episodic content isn't just dead weight — it's an attractive nuisance that contradicts current state.

---

## Batch 4 — semantic projection & the read path (2026-08-09)

User pain (from fabriqa-2026 practice): completed work piles up as episodic files (old plans, ADRs, specs); agents read stale ones before current truth; user hand-maintains "superseded-by" chains to redirect agents — token waste, fragile. Goal: semantic memory ALWAYS reflects reality; episodic is kept (not necessarily deleted) but out of the default read path, reachable via semantic references when detail is needed; users can register their own semantic artifact types and have specsmd keep them true.

### S4-1 — Event-sourced memory: intents are events, semantic docs are projections
Reclassify: intents/work items/bolts are **change records** — semantic while active (they spec the change being made), **episodic once complete**. A separate persistent semantic layer holds *current truth* (system facts: "auth uses X", architecture, integration inventory, standards). Completing work **projects the delta onto the semantic layer** — the auth-migration bolt's completion includes rewriting the auth truth doc. Like event sourcing: append-only event log + materialized views. Supersede chains disappear because truth lives in exactly one place (define-once) and history was never the read path.

### S4-2 — Read-path discipline with one-hop upward redirects
Agents read semantic first — the bootstrap/navigator says so, and layout enforces the scent: semantic docs prominent, episodic under an archival area whose README says "historical — read only when directed." Every episodic artifact carries a standing header: "Historical record ({date}). Current truth: {semantic doc link}." Redirects point UP to semantic, never sideways to newer episodic — one hop, no chains to maintain, because the semantic doc is unique and always current. Aged episodic moves out of the greppable hot path (archive folder), not deleted.

### S4-3 — Registered semantic doc types with declared scopes
The semantic layer is user-extensible: a project registers semantic artifact types — name, location, purpose, **scope** (topics/domains/paths it claims), update expectation — in the flow contract's project extension. The projection step matches a completing bolt's touched scope against registered docs' claimed scopes and requires each match be reviewed ("this bolt touched authentication; 'auth-architecture' claims that scope; confirm it's still true or update it"). This is "ask specsmd to keep my artifact up to date," declaratively.

### S4-4 — Decisions as events + an in-force index
ADR files are immutable episodic events (a decision WAS made — that never becomes false). What changes is which decisions are IN FORCE. A semantic **decisions index** lists only in-force decisions with their read-when hints; agents consult the index, never crawl the folder. Superseding a decision = new ADR event + index update + a one-hop upward stamp on the old ADR. Kills the stale-ADR read without deleting anything.

### S4-5 — Eager + lazy truth maintenance
Two loops keep semantic true: **eager** — the completion gate demands scope-matched semantic docs be confirmed-or-updated at the moment reality changes (catches the auth contradiction immediately); **lazy** — the recurring gardening pass finds drift that slipped through (semantic doc vs code, semantic doc vs semantic doc) and reports findings with remediations. Each semantic doc carries a verification status ("last confirmed true: date, by what"), so staleness is visible instead of discovered by accident.
