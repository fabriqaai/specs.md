# Tasks

- [ ] [000-flow-evals](#000-flow-evals) — Evals and verifiers exist before the flow is implemented
- [ ] [001-flow-schema](#001-flow-schema) — One contract defines the flow's artifacts, state, and names
- [ ] [002-recipe-catalog](#002-recipe-catalog) — Recipes are data the flow reads, not behavior the flow hardcodes
- [ ] [003-state-scripts](#003-state-scripts) — State changes are trustworthy — tooling-owned, gated, resumable
- [ ] [004-integrity-validator](#004-integrity-validator) — Drift between artifacts is detected, explained, and repaired with consent
- [ ] [005-planning-skills](#005-planning-skills) — Shaping work — capture intent, decompose, optionally pre-group
- [ ] [006-execution-skills](#006-execution-skills) — Executing work — bolts run recipes under the ceremony dial
- [ ] [007-navigator-status](#007-navigator-status) — The navigator — state seen through lenses, suggestions never mandates
- [ ] [008-standards-system](#008-standards-system) — Standards — the guardrail layer, from constitution to enforced check
- [ ] [009-plugin-packaging](#009-plugin-packaging) — The flow installs as the specsmd plugin and coexists with everything
- [ ] [010-v2-docs](#010-v2-docs) — v2 documentation lives under /v2 without disturbing v1
- [ ] [011-memory-lifecycle](#011-memory-lifecycle) — Memory model — current truth in system/, history as change records
- [ ] [012-slim-ops](#012-slim-ops) — Completed work has somewhere to go — a slim release step in the shipping lens

## 000-flow-evals
id: 000-flow-evals
title: Evals and verifiers exist before the flow is implemented
intent: 001-unified-bolt-flow
complexity: high
status: pending
depends_on: []
created: "Sun Aug 09 2026 03:00:00 GMT+0300 (GMT+03:00)"
sufficiency: not-cleared
sufficiency_report: docs/specsmd/intents/001-unified-bolt-flow/sufficiency/000-flow-evals.md

Before any part of the unified flow is built, the means of judging it exist. The flow's own specs are verified for sufficiency, and every later work item is implemented against checks that already exist. This inverts the usual order deliberately: a spec whose sufficiency is untested is an assumption, not a contract.

### Behavior

#### Sufficiency checks (tiered by complexity)
- Every work item receives a sufficiency check before its implementation starts; the check's rigor follows the spec's recorded complexity.
- **High complexity — triangulation**: an independent implementer (an agent with access to the spec and the flow's standards only — no conversation history, no reference implementation) produces an implementation; a separate judge compares its observable behavior against the spec's Definition of Done and reports gaps, ambiguities, and contradictions as proposed spec corrections. Two triangulation runs whose observable behavior diverges indicate ambiguity at the point of divergence.
- **Medium and low complexity — adversarial review**: a skeptic agent, given the spec alone, hunts for readings that would make two implementers diverge, contradictions, missing defaults, and untestable criteria — without implementing.
- **The pass bar**: a spec passes when no divergence-causing finding remains — every ambiguity that would make two implementers diverge, and every contradiction, is either resolved in the spec or converted into named intentional freedom. Advisory findings (style, completeness suggestions) may remain open. Full conformance of the probe implementation is *not* the bar; interchangeability is.
- The check's outcome — pass or outstanding findings, with the report — is recorded with the work item, so "this spec is cleared for implementation" is answerable from the artifact tree.

#### Conformance checking
- Every Definition of Done across the intent's work items can be evaluated, and the result honestly distinguishes machine-verified criteria from criteria needing human or scenario judgment. A criterion that cannot be evaluated at all is reported as a spec defect, not silently skipped.

#### Trigger evals
- For each model-invocable skill the flow ships, a set of canonical user prompts maps to the skill expected to activate; the evals report activation accuracy and mis-routing.

#### Holdout integrity
- Eval definitions and end-to-end holdout scenarios live in a dedicated top-level evals area of the repository, visible and reviewable like everything else. Implementing agents work in isolation from it: a change that implements flow behavior and touches the evals area in the same contribution is rejected automatically before merge. Evaluation reads the evals area; implementation never writes it.
- Holdout scenarios are judged on satisfaction — whether observed behavior satisfies the scenario — not on whether a test asserted true.

### Out of scope

Continuous/scheduled execution of these evals (attaches to the repository's automation). Evals for the legacy flows. Sufficiency checking of specs outside this intent (the same machinery would attach per-intent as the flow is used for other projects).

### Definition of Done

- [ ] (gating) Running the sufficiency check against any work item in this intent produces a recorded report of gaps, ambiguities, and proposed corrections, at the rigor its complexity calls for.
- [ ] (gating) A spec with an unresolved divergence-causing finding reports as not-cleared; resolving the finding (or naming it intentional freedom) flips it to cleared *(the state is answerable from the artifact tree)*.
- [ ] (gating) Conformance checking over this intent reports, per criterion: verified / failed / needs-human, with an overall coverage summary.
- [ ] (gating) Trigger evals run against the flow's model-invocable skill descriptions and report per-prompt routing outcomes.
- [ ] (gating) A contribution that changes flow implementation and the evals area together is rejected before merge; a contribution changing only one or the other passes.
- [ ] (advisory) Work items 001–012 have each been through their sufficiency pass before their implementation starts.

## 001-flow-schema
id: 001-flow-schema
title: "One contract defines the flow's artifacts, state, and names"
intent: 001-unified-bolt-flow
complexity: high
status: pending
depends_on: []
created: "Sun Aug 09 2026 03:00:00 GMT+0300 (GMT+03:00)"
sufficiency: cleared
sufficiency_date: "Thu Aug 13 2026 03:00:00 GMT+0300 (GMT+03:00)"
sufficiency_report: docs/specsmd/intents/001-unified-bolt-flow/sufficiency/001-flow-schema.md

Everything the flow knows about itself — where artifacts live, what state each artifact carries, what values state may take, how things are named — is defined once, in one machine-readable contract, and every consumer derives its knowledge from that contract. Nothing hardcodes a second copy.

### Behavior

- One contract document answers, for any artifact type (intent brief, work item, bolt record, standard, decision record): its location pattern, its identifier pattern, the state fields it carries, and the allowed values of each field. Each fact appears exactly once.
- There is one status vocabulary across all artifact types. An artifact's status is always one of its declared values; no consumer defines its own variant. *(The legacy flows' three conflicting status vocabularies are the failure this prevents.)*
- State lives in each artifact's own frontmatter. There is no central state file. The contract states this explicitly, together with the rule that only the flow's own tooling writes state.
- Identifiers are collision-safe under parallel work: two bolts created concurrently in separate working copies of the same project receive distinct identifiers.
- Any tool that needs flow knowledge (installer, dashboard, editor integrations, the flow's own skills) can obtain everything it needs by reading the contract. Adding an artifact type or status value is a contract change, not a code change in each consumer.
- Every artifact type declares its **memory class** — semantic (kept true, never expires) or episodic (history, archivable after a retention horizon). Change records (intents, work items, bolts) are semantic while active and episodic once terminal. There are exactly two classes; details in the memory-lifecycle work item.
- The contract supports project-registered semantic document types in the `system/` layer, each declaring name, purpose, and claimed scope.

### Out of scope

Migration of legacy artifact roots (a converter would attach as a separate reader of the legacy formats); the recipe file format (defined in the recipe catalog work item, referenced by this contract).

### Decided defaults

Closed answers live in `plugins/specsmd/skills/flow-runtime/references/flow-contract.yaml` — this section does not duplicate field lists.

- Artifact root is `docs/specsmd/`. Types: project, intent, work item, bolt, recipe, standard, decision, decisions index, system document.
- Status tokens are exactly `draft | pending | active | complete | abandoned`. Synonyms (`in-progress`, `completed`, `done`) are errors. Terminal class: `complete`, `abandoned`.
- Bolt ids are `bolt-{worktree}-{nnn}` where worktree is `{basename}-{sha1(absPath)[:6]}` so uncoordinated working copies do not collide. A bolt lives at `intents/{intent}/bolts/{id}/` and names work items from that intent only. Intent and work-item ids are `{nnn}-{slug}` unique inside one working copy *(named freedom: merge conflicts on those paths are resolved by the user)*.
- Only flow-runtime scripts write state fields. Skills and humans write bodies. Creating the artifact root is in-scope, not "installing." There is no central state file.
- Memory class is derived from status, not stored. Change records are semantic while non-terminal and episodic once terminal.
- Recipe *format* is work item 002. This contract records that recipes live at `docs/specsmd/recipes/{id}.yaml` and that the ceremony matrix plus complexity→recipe mapping live in the contract.

### Definition of Done

- [ ] (gating) For every artifact type, location, identifier pattern, state fields, allowed values, and memory class are answerable from the contract alone.
- [ ] (gating) No status value or artifact path pattern appears in more than one authoritative place.
- [ ] (gating) Creating two bolts concurrently in two working copies of one project yields non-colliding identifiers.
- [ ] (advisory) A consumer written against the contract needs no change when a new status value is added to the contract.

## 002-recipe-catalog
id: 002-recipe-catalog
title: "Recipes are data the flow reads, not behavior the flow hardcodes"
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [001-flow-schema]
created: "Sun Aug 09 2026 03:00:00 GMT+0300 (GMT+03:00)"
sufficiency: cleared
sufficiency_date: "Thu Aug 13 2026 03:00:00 GMT+0300 (GMT+03:00)"
sufficiency_report: docs/specsmd/intents/001-unified-bolt-flow/sufficiency/002-recipe-catalog.md

A recipe is a stage catalog: the ordered stages a bolt moves through, what each stage produces, and which stages may carry approval gates. Recipes live as data files in the project's recipe folder. The flow's execution machinery is recipe-agnostic — it reads whatever recipe a bolt declares and runs those stages.

### Behavior

- A recipe declares: its ordered stages; per stage, the artifacts the stage produces; per stage, whether it is gateable; and any recipe-level constraints stated declaratively (a stage in which no source code may be written; a mandatory time box whose expiry ends the bolt with findings).
- Four recipes ship with the flow: `default` (plan → execute → test → review), `ddd` (domain model → design → decisions → implement → test), `spike` (explore → findings, time-boxed), `simple` (plan → implement → walkthrough).
- A user adds a project-local recipe by adding one file to the recipe folder. No other change is needed; the new recipe is immediately selectable when starting a bolt.
- The recipe chosen for a bolt is recorded in the bolt's state at creation and does not change thereafter *(a wrong choice is resolved by completing or abandoning the bolt, not mutating it)*.
- When a bolt starts without an explicit recipe choice, the flow recommends one from the work items' recorded complexity; the user's choice always wins.

### Out of scope

Recipe composition/inheritance (a recipe importing another's stages) — would attach as an additional declaration in the recipe format. Per-stage tool restrictions — would attach as a recipe-level constraint.

### Decided defaults

Per-stage produces, gateable, and constraints live in the shipped recipe files — this section does not duplicate those tables.

- Recipe files are YAML at `docs/specsmd/recipes/{id}.yaml` (project) with shipped copies in the flow-runtime recipe catalog. Required fields: `id`, `stages[]` with `id`, `produces`, `gateable`; optional `completion_requires`, `constraints`.
- Four recipes ship: `default` (plan → execute → test → review), `ddd` (domain-model → design → decisions → implement → test), `spike` (explore → findings, time-boxed), `simple` (plan → implement → walkthrough).
- Completion evidence is `completion_requires`. Omitted `completion_requires` uses the contract default (`walkthrough.md`). Test evidence lives in the walkthrough; there is no separate test-report file.
- Omitted recipe: recommend from complexity — low→simple, medium→default, high→ddd. User choice always wins. Empty input applies the recommendation.
- A project file with the same id shadows the shipped recipe at bolt creation. The bolt records `recipe` (id) and an immutable `recipe_snapshot` of the parsed recipe. Later file edits do not change an in-flight bolt.
- Spike time box: `duration: PT8H`, `on_expiry: complete_with_findings`. Clock starts when the bolt becomes active. The next tooling write after expiry writes `findings.md` if missing and completes through the normal complete path (not an override). Partial findings are valid.
- Known constraint kinds: `time_box`, `no_source_code`. Unknown constraint kinds are refused at recipe-load (terminal).

### Definition of Done

- [ ] (gating) Each of the four shipped recipes, read from its data file, yields its declared stage order and per-stage artifacts.
- [ ] (gating) A project-local recipe file added to the recipe folder is selectable at bolt creation with no other change.
- [ ] (gating) A bolt's recorded recipe never changes after creation.
- [ ] (gating) The spike recipe's time box, once expired, ends the bolt with a findings artifact rather than continuing *(partial findings are a valid outcome, not a failure)*.
- [ ] (advisory) Recommending a recipe from complexity matches the documented mapping.

## 003-state-scripts
id: 003-state-scripts
title: "State changes are trustworthy — tooling-owned, gated, resumable"
intent: 001-unified-bolt-flow
complexity: high
status: pending
depends_on: [001-flow-schema, 002-recipe-catalog]
created: "Sun Aug 09 2026 03:00:00 GMT+0300 (GMT+03:00)"
sufficiency: cleared
sufficiency_date: "Thu Aug 13 2026 03:00:00 GMT+0300 (GMT+03:00)"
sufficiency_report: docs/specsmd/intents/001-unified-bolt-flow/sufficiency/003-state-scripts.md

All state mutation goes through the flow's own tooling. Because state is trustworthy, everything downstream — resuming, routing, completion, reporting — can rely on it without re-deriving the world from scratch.

### Behavior

- Creating a bolt, advancing its stage, recording a checkpoint decision, and completing work happen only through the flow's tooling. The tooling maintains the status cascade: completing a bolt updates its work items; a work item's status is reflected in its intent's status.
- **Completion is goal-gated**: completing is refused while the bolt's recipe-required evidence is missing or a gating acceptance criterion is unmet. The refusal message states exactly what is missing and how to produce it *(a remediation instruction, not a diagnostic dump)*. An explicit override exists; using it is recorded in the bolt's state as an override.
- **Resume is state-derived**: an interrupted bolt resumes from its recorded stage and checkpoint state — never inferred from which artifact files happen to exist.
- Failures are typed: a retryable condition (transient), a terminal condition (needs a different input), and a structural condition (the artifact tree itself is invalid) produce distinguishable outcomes, and retry effort is never spent on terminal or structural conditions.
- The tooling leaves user projects untouched: it installs nothing into the project, requires nothing of the project's language or package manager, and writes only within the flow's artifact root.
- Checkpoint decisions accept the natural vocabulary of approval ("yes", "approved", "go ahead") and normalize it; save-then-resume produces the same continuation as never having stopped.

### Out of scope

Concurrent mutation locking across parallel bolts (identifier collision-safety is in the flow contract; simultaneous edits to one bolt's state would attach here as an advisory check in the integrity validator).

### Decided defaults

Operations: init-project, init-intent, init-work-item, init-bolt (and --draft), update-stage, update-checkpoint, complete-bolt (--force override), status (read-only).

- Cascade on complete: listed work items → `complete`; intent → `complete` if all its items are terminal, else `active` if any are pending/active, else `abandoned` if all abandoned.
- Completion oracle: every `completion_requires` file exists; every listed work item has no unchecked `- [ ] (gating)` line. Walkthrough may not contain a language-tagged fence. `--force` skips the oracle and records `override: true`.
- Ceremony defaults: see the matrix in the flow contract. Omitted ceremony is derived. Autopilot: no gates. Confirm: first gateable. Validate: all gateable. Approval phrases in the contract normalize to `granted`; deny phrases leave the gate `awaiting`.
- Failures: `retryable` exit 1, `terminal` exit 2, `structural` exit 3. Each carries `remediation`.
- Resume uses `current_stage` + `checkpoint_state` only. Concurrent writes to one bolt: last writer wins *(named freedom)*.
- A time-boxed bolt that has expired is completed by the next tooling write (`update-stage`, `update-checkpoint`, `complete-bolt`) through the complete path, not as an override.

### Definition of Done

- [ ] (gating) A bolt completed through the tooling cascades: bolt complete → its work items complete → intent status reflects it.
- [ ] (gating) Completing a bolt with missing required evidence is refused, and the refusal names the missing evidence and the action that produces it.
- [ ] (gating) An override of a refused completion succeeds and is visible in the bolt's recorded state afterward.
- [ ] (gating) A bolt interrupted mid-stage resumes at its recorded stage even when later-stage artifact files exist on disk *(state wins over file existence)*.
- [ ] (gating) Running the flow's tooling in a project with no package manifest of any kind succeeds and modifies nothing outside the artifact root.
- [ ] (advisory) Fifteen common approval phrasings normalize to the intended checkpoint state.

## 004-integrity-validator
id: 004-integrity-validator
title: "Drift between artifacts is detected, explained, and repaired with consent"
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [003-state-scripts]
created: "Sun Aug 09 2026 03:00:00 GMT+0300 (GMT+03:00)"

With state distributed across artifact frontmatter, drift is the failure mode to defend against. Integrity validation finds every class of drift, explains each finding with a remediation, and repairs only with consent.

### Behavior

- Validation detects at least: status-cascade violations (a completed bolt whose work items are still pending), orphaned references (a bolt naming a work item that doesn't exist, a dependency naming a missing item), stale in-progress bolts (no state change beyond a declared threshold; the threshold has a default and is configurable), state values outside the flow contract's vocabulary, and identifier/location mismatches.
- Every finding carries: severity, whether it is auto-repairable, and a remediation instruction stating what to change and where.
- Nothing is repaired without consent. Consent can be granted per finding or for all auto-repairable findings at once. Every repair is recorded in a maintenance log with what changed and why.
- Validation is usable by machines and by humans: a non-interactive mode produces machine-readable findings and a meaningful exit status; an interactive mode walks findings with repair choices.
- A clean tree validates clean *(no findings invented to seem useful)*.

### Definition of Done

- [ ] (gating) Each listed drift class, introduced deliberately into a test tree, is detected and reported with severity and remediation.
- [ ] (gating) No repair occurs without consent; every performed repair appears in the maintenance log.
- [ ] (gating) Non-interactive validation of a clean tree reports zero findings and a success exit status.
- [ ] (advisory) A finding's remediation instruction is sufficient for an agent to perform the repair without further context.

## 005-planning-skills
id: 005-planning-skills
title: "Shaping work — capture intent, decompose, optionally pre-group"
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [001-flow-schema]
created: "Sun Aug 09 2026 03:00:00 GMT+0300 (GMT+03:00)"
sufficiency: dogfood-cleared
sufficiency_date: "Thu Aug 13 2026 03:00:00 GMT+0300 (GMT+03:00)"

The shaping side of the flow turns rough direction into nlspec artifacts: intent briefs, work items, and — optionally — draft bolts. Every shaping skill is invocable at any time, in any order; each ends by stating what now exists, never by mandating what happens next.

### Behavior

- **Intent capture** turns a dialogue into an intent brief: problem, outcome, scope, non-goals. Briefs follow the nlspec standard's intent register — pure intent, no mechanism.
- **Decomposition** turns an intent into work items: vertical slices, each with observable acceptance criteria per the nlspec standard, an assessed complexity, and dependencies. Circular dependencies are refused at creation with the cycle named. The suggested ceremony (from complexity × the project's autonomy bias) is recorded on the work item as a recommendation the user can override at bolt time.
- **Pre-grouping** (the optional planning ritual) writes draft bolts: proposals naming a grouping of work items and a suggested recipe. A draft is data; starting a bolt may adopt a draft, modify it, or ignore all drafts. Unadopted drafts age harmlessly *(the integrity validator may flag stale drafts, advisory only)*.
- No shaping skill requires another to have run first: decomposition against a one-line intent works (and says what's thin); capture after work items exist works (and links them).
- Ambiguity discovered while shaping is resolved per the nlspec standard's failure table: interchangeable readings are chosen and named; non-interchangeable ones are asked.

### Decided defaults (dogfood slice)

Shaping skills are exactly `plan-intent`, `work-item-decompose`. Draft grouping is a mode of `bolt-design`. Each is by-name only. None requires another. None uses required-next language.

- Intent brief required sections: problem, outcome, scope, non-goals. Additional sections allowed.
- Complexity: `low | medium | high` by decision load (see skill). Default `medium`. Unset autonomy bias is `balanced`. Suggested ceremony is the contract matrix, recorded as `ceremony_suggested`.
- Cycle: the invocation writes nothing and names the cycle as an ordered id list.
- Drafts: `bolt-design` offers adopt / modify / ignore; dismiss = ignore. Adopt consumes the draft (`abandoned`). Modify/ignore leave it.

### Definition of Done

- [ ] (gating) A dialogue produces an intent brief conforming to the flow contract and the nlspec standard's intent register.
- [ ] (gating) Decomposition produces work items whose acceptance criteria are behavioral *(an internal-attribute criterion is flagged at authoring time, advisory)*.
- [ ] (gating) A dependency cycle among work items is refused with the cycle named.
- [ ] (gating) Starting a bolt with drafts present offers adopt / modify / ignore; ignoring leaves drafts unchanged.
- [ ] (advisory) Each shaping skill's closing message states the artifacts that now exist and offers — without requiring — natural next moves.

## 006-execution-skills
id: 006-execution-skills
title: Executing work — bolts run recipes under the ceremony dial
intent: 001-unified-bolt-flow
complexity: high
status: pending
depends_on: [002-recipe-catalog, 003-state-scripts]
created: "Sun Aug 09 2026 03:00:00 GMT+0300 (GMT+03:00)"
sufficiency: dogfood-cleared
sufficiency_date: "Thu Aug 13 2026 03:00:00 GMT+0300 (GMT+03:00)"

Execution is where agents do the work. A bolt is created when the user (or the flow's recommendation, accepted by the user) decides work starts; it runs its recipe's stages under exactly as much ceremony as the work's complexity and the project's autonomy bias call for.

### Behavior

- Starting a bolt offers scope: a single work item, a batch, or an existing draft. The chosen work items, recipe, and ceremony level are recorded in the bolt's state at creation.
- Stages come from the bolt's recipe — execution is recipe-agnostic. A stage's required artifacts must exist before the stage is recorded complete.
- The ceremony dial governs gates: at the autonomous end stages flow without stopping; at the controlled end each gateable stage awaits approval. Awaiting, granted, and not-required gate states are readable from the bolt's state at any time.
- The plan a bolt produces is itself a spec: at confirm and validate ceremony the plan is presented for genuine review before implementation *(an unread approved plan encodes instructions nobody chose — the flow surfaces the plan, not a summary of it)*.
- Guardrail failures during execution (a standard violated, required evidence missing) reach the agent as remediation instructions — what to change, where, and which standard says so.
- Decision-heavy recipes record decisions as retrievable entries: each decision names when a future reader should consult it.
- A completed bolt yields a human-facing walkthrough: what changed, why, deviations from plan, and how to verify — containing no code.
- Review feedback (from humans or reviewing agents) is severity-gated: load-bearing findings block; advisory findings may be acknowledged, deferred, or contested with reasoning.

### Out of scope

Deployment and post-release operation (the Operations question is open at the intent level). Parallel execution coordination beyond what identifier safety and per-bolt state already give.

### Decided defaults (dogfood slice)

Execution is two skills: `bolt-design` (draft, start, plan/design/decisions, two-implementer) and `bolt-execute` (implement, test, walkthrough). `bolt-execute` follows `bolt-design` when design is not done. By-name only. Recipe-agnostic. A bolt is scoped to one intent and lives under that intent's folder.

- Ceremony values: `autopilot` (no gates), `confirm` (first gateable stage), `validate` (every gateable stage). Default = most controlled `ceremony_suggested` among chosen items, unless the user sets one.
- Confirm/validate: emit the full plan text in the approval turn. Autopilot still writes `plan.md` when the recipe requires it.
- Completing the bolt completes every tracked item, or none if evidence/gating ACs are missing.
- Every completed bolt yields a walkthrough (even without a walkthrough stage). "No code" = no language-tagged fences, source listings, or patches. Deviations section always exists.
- Gate states: `awaiting | granted | not-required`. Denial leaves `awaiting`.

### Definition of Done

- [ ] (gating) A bolt started from a batch of two work items runs its recipe's stages once for the bolt, tracks both items, and completes both on bolt completion.
- [ ] (gating) The same recipe run at autonomous ceremony reaches completion with zero approval stops; at controlled ceremony every gateable stage stops and awaits.
- [ ] (gating) A bolt's gate state is answerable from its recorded state at any moment *(no reconstruction from conversation history)*.
- [ ] (gating) Completion without the recipe's required test evidence is refused by the state layer *(the skill cannot talk its way past it)*.
- [ ] (gating) The walkthrough of a completed bolt contains no code and includes deviations from plan.
- [ ] (advisory) A decision entry's "consult when" hint retrieves the decision in a later bolt facing that situation.

## 007-navigator-status
id: 007-navigator-status
title: "The navigator — state seen through lenses, suggestions never mandates"
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [003-state-scripts]
created: "Sun Aug 09 2026 03:00:00 GMT+0300 (GMT+03:00)"
sufficiency: dogfood-cleared
sufficiency_date: "Thu Aug 13 2026 03:00:00 GMT+0300 (GMT+03:00)"

The navigator is how anyone — user or model — orients. It reads the artifact tree and answers: where are we, what's healthy, what's worth doing next. It recommends; it never gates.

### Behavior

- Status is reported through the three lenses: **shaping** (intents and work items not yet in any bolt), **building** (active bolts with stage and gate state), **shipping** (completed work awaiting whatever comes after). The lenses are views over state — nothing about them restricts what may be invoked.
- Suggested next moves derive from state: pending shaped work suggests starting a bolt; an interrupted bolt suggests resuming it; an empty tree suggests capturing an intent; an awaiting gate suggests reviewing it. Suggestions are presented as options with the computed best first; every option is declinable and the menu never hides capabilities.
- Health is included: the integrity validator's findings appear in status, summarized with severities.
- The navigator and the flow's bootstrap are the only parts of the flow that announce themselves to the model unprompted; everything else activates by name.

### Decided defaults (dogfood slice)

Navigator is `specsmd-status`. Bootstrap is `using-specsmd`. Those two are the only model-invocable skills. Lenses are views, not skills. The navigator never writes state and never invokes another skill.

Suggestion order: awaiting gate → active bolt → intent with zero items → unbolted work items → drafts → empty tree. Best first; remaining applicable moves next; then "any skill by name."

### Definition of Done

- [ ] (gating) A tree with one unstarted intent, one active bolt, and one completed bolt reports each under its correct lens.
- [ ] (gating) For each of the four state situations listed, the computed best next move matches, and it is presented as an option, not an action taken.
- [ ] (gating) Integrity findings present in the tree appear in status output.
- [ ] (advisory) A user who ignores every suggestion and invokes any skill directly is never warned, blocked, or nagged by the navigator.

## 008-standards-system
id: 008-standards-system
title: "Standards — the guardrail layer, from constitution to enforced check"
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [001-flow-schema]
created: "Sun Aug 09 2026 03:00:00 GMT+0300 (GMT+03:00)"

Standards are where the technical opinions live that specs deliberately leave out: the project's choices among valid options. They are guardrails with an escalation ladder — stated as principle, hardened into enforcement only when violations recur.

### Behavior

- A project's standards include a **constitution** — rules that hold everywhere and can never be overridden by any module — plus one overridable engineering standard (stack, shape, and verification as lasting invariants) and the nlspec writing standard.
- In a monorepo, standards resolve by nearest scope: a module's standard wins over the root's for files in that module; the constitution is exempt and always wins. For any file, the resolved standard set is answerable deterministically.
- Standards are written as invariants where possible — properties that must hold ("inputs are parsed at the boundary") — rather than prescriptions of method. Each records its **enforcement tier**: stated principle → checked by review → checked mechanically. A standard's tier can be raised when violations recur; the raise is a recorded decision.
- Violations reported at any tier are phrased as remediation instructions naming the standard, the file, and the change that satisfies it.
- Project initialization asks one question — the autonomy bias — and derives the rest: workspace shape (single project or monorepo, greenfield or existing code) is detected; standards are generated as proposals; in an existing codebase, inferred standards are confirmed with the user before adoption.

### Out of scope

A marketplace/registry of shareable standard sets (would attach as an import source for the standards folder). Mechanical enforcement infrastructure itself (each standard's check attaches to the project's own linting/testing; the flow records tier and phrasing).

### Definition of Done

- [ ] (gating) A module standard overrides the root standard for that module's files; the constitution is never overridden anywhere.
- [ ] (gating) For any file in a monorepo test tree, the resolved standard set is deterministic and explainable (which scope won and why).
- [ ] (gating) Initialization in an empty project and in an existing codebase each complete with exactly one required question.
- [ ] (gating) Inferred standards in an existing codebase are presented for confirmation before being recorded.
- [ ] (advisory) Each shipped standard template states its invariant, its current enforcement tier, and its remediation phrasing.

## 009-plugin-packaging
id: 009-plugin-packaging
title: The flow installs as the specsmd plugin and coexists with everything
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [000-flow-evals, 005-planning-skills, 006-execution-skills, 007-navigator-status, 008-standards-system]
created: "Sun Aug 09 2026 03:00:00 GMT+0300 (GMT+03:00)"

The unified flow reaches users as the **specsmd** plugin — the default install, the AI-DLC v2 implementation. Installing it yields a working flow in one step; nothing about it disturbs legacy users.

### Behavior

- Installing the plugin through a supported channel (plugin marketplace or the skills bootstrapper) yields a flow where: the navigator responds, shaping and execution skills are invocable by name, and the artifact root is created on first use.
- The plugin conforms to the same format rules the existing plugin validation enforces (skill frontmatter, plugin manifest, per-tool overlays); trigger evals from the evals work item pass against its shipped descriptions.
- The model-invocable surface is minimal: the navigator and the bootstrap announce themselves; every other skill activates by name only.
- Legacy plugins continue to install and pass their validation unchanged; a project using a legacy flow is never auto-migrated or warned by the new plugin.
- The plugin is self-contained (decision, 2026-08-09): it carries its own bootstrap and navigator — one install yields the complete flow, with no dependency on a shared core plugin. The decision entry is `docs/specsmd/decisions/001-self-contained-plugin.md` (rejected alternative: shared `specsmd-core` + thin profile).
- Distribution is marketplace-only: no npm CLI ships for the unified flow. Tools without a plugin marketplace are served by a documented manual path (the plugin's skills copied into the tool's skills directory), covered in the v2 documentation.

### Definition of Done

- [ ] (gating) A fresh install via each supported marketplace channel produces a responding navigator and by-name skill activation, with no second install required.
- [ ] (gating) The documented manual path, followed verbatim in a marketplace-less tool, yields by-name skill activation.
- [ ] (gating) The plugin passes the repository's plugin-format validation.
- [ ] (gating) Trigger evals pass against the shipped skill descriptions.
- [ ] (gating) Legacy plugin validation results are identical before and after this work item.
- [ ] (gating) The core-relationship decision exists as a decision entry naming the rejected alternative.

## 010-v2-docs
id: 010-v2-docs
title: v2 documentation lives under /v2 without disturbing v1
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [009-plugin-packaging]
created: "Sun Aug 09 2026 03:00:00 GMT+0300 (GMT+03:00)"

The unified flow is documented on the site under the `/v2` path. Legacy documentation keeps every existing URL. One site carries both, with a visible way to switch.

### Behavior

- The `/v2` section covers: a quickstart (install → first intent → first bolt), the concepts (bolt, recipe, ceremony dial, lenses, nlspec, memory model), a recipe reference, a skills reference, the nlspec writing standard, the manual install path for tools without a plugin marketplace, and a "coming from v1" terminology mapping for both legacy flows *(orientation only — v2 provides no migration tooling, and the docs say so plainly)*.
- Every documentation URL that resolved before this work resolves to the same content after it.
- A version switcher is visible from both documentation sets.
- The site deploys from the v2 branch and carries both documentation sets.
- No competitor tool is named anywhere in the documentation.

### Definition of Done

- [ ] (gating) Every pre-existing documentation URL returns its prior content.
- [ ] (gating) The `/v2` quickstart, followed verbatim in a fresh project, reaches a completed first bolt.
- [ ] (gating) The version switcher is reachable from the legacy docs home and the /v2 home.
- [ ] (gating) A search of the documentation source for known competitor names returns nothing.
- [ ] (advisory) The terminology mapping covers every renamed concept from both legacy flows.

## 011-memory-lifecycle
id: 011-memory-lifecycle
title: "Memory model — current truth in system/, history as change records"
intent: 001-unified-bolt-flow
complexity: high
status: pending
depends_on: [001-flow-schema, 003-state-scripts, 004-integrity-validator]
created: "Sun Aug 09 2026 03:00:00 GMT+0300 (GMT+03:00)"

The artifact tree is the project's memory, in two classes with different lifecycles. **Semantic memory always reflects reality**; **episodic memory is history** — valuable, kept, but never the default read path.

Intents, work items, and bolts are **change records**: they specify a delta. While active they are the working spec of that delta; once complete they become episodic — history that is *correctly* stale. Current truth lives in the **`system/` layer**: a small set of persistent documents stating what is true now (architecture, integrations, domain facts). Completing a change is *projected* onto that layer — when the auth migration completes, the auth truth document says the new reality, and no chain of superseded files needs maintaining, because truth has exactly one address and history points up to it.

### Behavior

#### Classes and the contract
- The flow contract declares each artifact type's memory class. Change records (intents, work items, bolts and their stage artifacts) are semantic while active and episodic once their status is terminal. `system/` documents, standards, and the decisions index are always semantic. Exactly two classes exist.
- A project registers its own semantic document types in `system/`: each declares a name, purpose, and **scope** — the topics or areas of the codebase it claims. Registration is data; adding a type requires nothing but the declaration.

#### Projection (advisory)
- When a bolt completes, the flow matches the bolt's touched scope against registered `system/` documents' claimed scopes and surfaces each match for review: confirm still true, or update. This is a recommendation with a named target — never a completion blocker.
- A scope-matched document left unreviewed becomes an integrity finding (advisory severity) naming the bolt, the document, and what to verify.
- Each `system/` document carries a visible verification status: when it was last confirmed true and by what. Staleness is a lookup, not an accident.

#### The read path
- Semantic memory is read first: the flow's bootstrap and navigator direct agents to `system/`, standards, and the decisions index before anything else. Episodic artifacts are read only when a semantic document refers to them for detail, or when the user asks for history.
- Every episodic artifact carries a standing header naming its nature and its upward pointer: "Historical record ({date}). Current truth: {semantic document}." Pointers go up to semantic, never sideways to newer episodic — one hop, nothing to re-chain when reality changes again.
- Episodic artifacts past their retention horizon move to an archive area out of the default search path. Nothing requires deletion; in a version-controlled project, history retains everything regardless.

#### Decisions
- Decision records are immutable episodic events — that a decision was made never becomes false. Which decisions are **in force** is semantic: the decisions index lists only in-force decisions, each with a hint naming when a future reader should consult it. Superseding a decision adds a new record, updates the index, and stamps the old record's upward pointer. Agents consult the index; they do not crawl the folder.

#### Forgetting (gated, unlike projection)
- Moving an episodic record to the archive — and any deeper pruning — is refused while the record holds uncaptured truth: a decision absent from the index, or a discovery that changed behavior but is reflected in no semantic document. The refusal names what is missing and where it belongs. An explicit override exists and is recorded.
- Archival changes nothing downstream: completed statuses, cascades, and the bolt's compact index entry are unaffected.

#### Gardening (the lazy loop)
- A recurring maintenance pass detects: semantic documents contradicting the current system, semantic documents contradicting each other, in-force index entries pointing at superseded records, episodic artifacts past horizon still in the hot path, and missing upward pointers. Each finding carries severity and a remediation. Nothing is changed without consent; everything done is logged.

### Out of scope

Cross-project memory (outside the artifact root). Scheduling of the gardening pass (the flow provides the invocable pass; automation is the project's). Retrieval tooling beyond the read-path conventions (a queryable index would attach as a consumer of the flow contract).

### Definition of Done

- [ ] (gating) The contract answers, for every artifact type, its memory class — including the active→terminal class transition for change records.
- [ ] (gating) A registered `system/` document whose scope matches a completing bolt is surfaced for review at completion; declining to review completes the bolt anyway and leaves an advisory finding.
- [ ] (gating) Every episodic artifact created by the flow carries the historical-record header with a valid upward pointer.
- [ ] (gating) The decisions index lists only in-force decisions; superseding via the flow updates the index and the old record's pointer in one operation.
- [ ] (gating) Archiving an episodic record holding an unindexed decision is refused with the decision and its destination named; the override, when used, is visible in the record.
- [ ] (gating) A `system/` document deliberately contradicting the codebase is reported by the gardening pass with a remediation *(not silently tolerated, not silently fixed)*.
- [ ] (advisory) An agent following the bootstrap's read-path guidance reaches current truth without opening any episodic artifact.

## 012-slim-ops
id: 012-slim-ops
title: Completed work has somewhere to go — a slim release step in the shipping lens
intent: 001-unified-bolt-flow
complexity: low
status: abandoned
depends_on: [006-execution-skills, 007-navigator-status]
created: "Sun Aug 09 2026 03:00:00 GMT+0300 (GMT+03:00)"

**Not shipped.** The specsmd plugin has no release or ops skills. Shipping is a status lens over completed bolts, not a release workflow. This work item is kept as a deferred spec.

v1 of the unified flow does not ship full operations capabilities (build/deploy/monitor are a possible follow-up). A slim release step was considered so the shipping lens would be a place work moves through rather than a shelf it sits on. That step is deferred.

### Behavior

- A release checklist can be produced for any set of completed bolts: what changed (from walkthroughs), verification evidence present, standards findings outstanding, and any release-relevant decisions since the last checklist.
- A verify step records, per released change, that a human or agent confirmed observable behavior in the target environment; the confirmation is part of the record, not a conversation.
- The navigator's shipping lens shows completed work not yet released and offers the checklist as a suggestion — like everything else, never a mandate.
- Nothing in the flow gates on release: completion and release are independent; a project that never uses the release step sees no findings about it.

### Out of scope

Build, deploy, environment progression, and monitoring (the follow-up's extension point is the release record: fuller operations would consume and extend it). Integration with any CI/CD system.

### Definition of Done

- [ ] (gating) A release checklist over two completed bolts includes each bolt's changes, verification evidence, and outstanding findings.
- [ ] (gating) A recorded verification is answerable later from the artifact tree *(who/what confirmed, when, against which change)*.
- [ ] (gating) The shipping lens distinguishes completed-unreleased from released work.
- [ ] (advisory) A project that never releases sees no release-related findings.

