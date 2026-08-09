# Concept Brief — Unified Bolt Flow

**Session**: aidlc-fire-unification-20260809 · **Date**: 2026-08-09
**Status**: Shaped concept — supersedes the "Option B symmetric profiles" recommendation of `memory-bank/research/aidlc-fire-unification-study.md` with an asymmetric design, per user decisions in this session.

## Pitch

One skills-native flow that merges AI-DLC and FIRE: **FIRE's mechanics, AI-DLC's vocabulary, nobody's coercion.** Work is captured as intents and work items; execution happens in **bolts** — dynamic containers created whenever you're ready, grouping one or more work items, running a **recipe** of stages under a **ceremony dial**. The flow recommends a path; it never forces one. Artifacts live in `docs/specsmd/` — visible, browsable project documentation, not hidden tool state.

## User decisions locked in this session

| Decision | Choice |
|---|---|
| Core model | FIRE-shaped (dynamic grouping at execution time) — user prefers it over upfront bolt planning; FIRE was conceived as "lite-aidlc" |
| Enforcement | None by skills. Recommendation via navigator/descriptions/templates; scripts gate only on state prerequisites |
| AI-DLC compatibility | Dynamic bolt creation is *not* incompatible — planning ahead is recommended-available (draft bolts), never mandated. Skills don't enforce inception/construction |
| Artifact root | `docs/specsmd/` — new single root; visible docs folder; legacy `memory-bank/` and `.specs-fire/` frozen for existing users |
| Container name | **bolt** (brand word retained, redefined as the dynamic container; "run" remains a plain verb) |
| State model | **Markdown frontmatter, AI-DLC style** — no central `state.yaml`. State lives in the artifacts themselves (bolt.md, work items, briefs); scripts own mutations and reconcile the cascade |
| Spec register | **Intents and work items are nlspecs** (2026-08-09): behavior not mechanism, behavioral Definition of Done, no code/file names. Standard: `docs/specsmd/standards/nlspec.md`; research: `memory-bank/research/nlspec-harness-study.md` |
| Verification | **Evals-first** (2026-08-09): spec-sufficiency triangulation, DoD conformance with honest coverage, trigger evals, and holdout scenarios exist before implementation (work item 000) |

## Architecture

### Hierarchy
**Intent → Work Item**, with **Bolt** as the orthogonal execution container (1..N work items, may cross intents). No unit/story middle layer; work items carry complexity, acceptance criteria, dependencies.

### The bolt lifecycle
- Created any time via `bolt-start` (script-gated: `init-bolt` is the only way to mint one).
- Picks a **recipe** at creation — `default` (plan → execute → test → review), `ddd` (domain model → design → ADR → implement → test), `spike` (time-boxed, knowledge output), `simple`. Recipes are data files (stage catalogs), not code branches. AI-DLC's bolt types survive intact here.
- Runs under the **ceremony dial**: complexity × autonomy bias → autopilot (0 gates) / confirm (1) / validate (2+, per-stage under `controlled`). "AI plans, human validates" is the controlled end of the dial.
- Completion is script-gated (test report must exist; phase guard), never sequence-gated.

### Recommend, don't enforce — the three places
1. **Navigator/status skill** computes "suggested next" from state (the only model-invocable routing surface).
2. **Skill descriptions** carry the happy-path scent ("typically follows X").
3. **Templates** show the ideal progression.
Scripts gate on state prerequisites only. This is documented as a design principle, not an implementation gap.

### Draft bolts (upfront planning, optional)
A `bolt-plan` skill writes **bolt proposals** (grouping + recipe hints) into state. `bolt-start` offers: adopt a draft / regroup / cherry-pick. Planned-ahead and grouped-on-the-fly are the same data structure at different times. This preserves the AI-DLC inception ritual for those who want it.

### Phases as lenses
Inception/Construction/Operations are **views over state** in status output — shaping / building / shipping — not modes. Three-phase vocabulary survives descriptively; nothing gates on phase.

### Root layout
```
docs/specsmd/
├── intents/{id}/           # brief.md + work items — status in frontmatter
├── bolts/{id}/             # bolt.md (frontmatter: status, recipe, current_stage,
│                           #   stages_completed, checkpoint_state, work_items),
│                           #   plan.md, test-report.md, walkthrough.md, review-report.md
├── recipes/                # stage catalogs as data (default, ddd, spike, simple) — user-extensible
├── standards/              # constitution + hierarchical monorepo overrides (FIRE)
└── decisions/              # ADRs + "Read when" index (AI-DLC's mechanism FIRE never got)
```

**State model (user decision)**: no central `state.yaml`. State lives in artifact frontmatter, AI-DLC style — `bolt.md` carries `status`, `recipe`, `current_stage`, `stages_completed`, `checkpoint_state`, `work_items`; work items and intent briefs carry their own `status`. FIRE's resumability engineering is *re-expressed over frontmatter*: scripts remain the only writers (init-bolt / update-stage / update-checkpoint / complete-bolt), resume point derives from `bolt.md` frontmatter (never from which artifact files happen to exist), the completion phase guard survives, and the status cascade (bolt → work items → intent) plus integrity validator reconcile drift. Parallel bolts = multiple bolt.md files with `status: in-progress`; discovery is a directory scan, not an array lookup.

### What each flow contributes
- **From FIRE**: script-owned state mutation discipline, resume tables, phase/completion guards, autonomy bias, code-review skill, walkthrough, monorepo standards + constitution, greenfield/brownfield detection, parallel bolts, integrity validator.
- **From AI-DLC**: the *bolt* name, recipe depth (DDD stages, spike time-boxing), ADR + decision-index retrieval, bolt-plan (as draft bolts), replanning, Operations skills (build/deploy/verify/monitor — recommended path, not gated phase).

## Delivery

Skills-native from day one, on the plugin architecture already built on `specsmd-skills`.

**Plugin naming (user decision, 2026-08-09)**: the unified flow ships as the **`specsmd`** plugin — the default install. It *is* the AI-DLC v2 implementation. Other flows are separate plugins created alongside/later: `specsmd-simple`, `specsmd-ideation`, etc. The existing `specsmd-aidlc` and `specsmd-fire` plugins remain published and frozen as the legacy v1 channels.

```bash
/plugin install specsmd@specsmd          # → the unified bolt flow (AI-DLC v2)
/plugin install specsmd-ideation@specsmd # → optional companion flows
```

Fewer model-invocable descriptions than today's 8 — one navigator, one bootstrap, a handful of phase-lens skills; all verbs stay `disable-model-invocation: true`.

## Versioning, branching & website (user decisions, 2026-08-09)

- **v1 is immutable, forever**: the existing flows live on their own branch and on the current npm package. No changes, ever — not even ports. Existing users are never disturbed.
- **v2 lives on a new `main-v2` branch**: all unified-flow/skills work happens there. Two branches carry two versions — no single branch juggling both.
- **Website**: existing URLs are never broken (SEO). The v2 documentation lives under **`/v2`** on the same site. The site deploys from `main-v2`, which therefore carries **both** documentation sets — legacy docs at their existing URLs, unified-flow docs under `/v2`.
- **Implication for `specsmd-skills`**: the skills-port branch (plugins for v1 flows) should seed/merge into `main-v2`, not into `main` — since v1 on `main` is frozen, even the v1-flow plugins are v2-track deliverables.

## Risks & mitigations (from flame-report.md)

1. **Bolt redefinition vs AWS spec** → draft bolts keep fidelity available; `.claude/CLAUDE.md` must be rewritten (it currently forbids modifying AI-DLC concepts — that rule now scopes to the frozen legacy flow only).
2. **~~state.yaml churn in PR diffs~~ Resolved** — user decision: no central state.yaml; state lives in artifact frontmatter (AI-DLC style). Frontmatter diffs in PRs are meaningful spec-status changes, not machine noise. Residual risk: distributed state means dashboard/VS Code parse many files and resume/parallel-bolt discovery is a scan — mitigated by script-only writes + integrity validator (AI-DLC already proved this model works).
3. **Recipe abstraction leakage** → recipes and gate matrix stay declarative data; conformance tests in the existing plugin-validation suite.
4. **Tooling gains a third root** → prerequisite is study Phase 1 (one parsed flow contract driving flow-detect, dashboard, VS Code).
5. **Naming collisions in skills** — `bolt-start`, `bolt-plan` exist in the aidlc plugin with different semantics; unified plugin needs its own namespace.

## Open questions

1. ~~Unified plugin name~~ Resolved: **`specsmd`** — default plugin = the unified flow = AI-DLC v2; companion flows as `specsmd-*` plugins.
2. Do Operations skills ship in v1 of the unified flow or follow?
3. Migration tooling for existing users who *want* to move (converter from memory-bank/ and .specs-fire/), or frozen-only?
4. npm strategy for v2: v1 keeps the current npm package — does v2 ship as a major bump on the same package (dist-tags: `latest`=v2, `v1` pinned), a new package, or marketplace/plugins-only?
5. When (if ever) does `main-v2` become the repo's default branch?

## Suggested next steps

1. ~~User reviews this brief~~ Green-lit 2026-08-09 (with frontmatter-state amendment).
2. ~~Rewrite `.claude/CLAUDE.md` fidelity rules to scope to legacy aidlc~~ Done 2026-08-09.
3. Spec the unified flow as work items (dogfood: this could be the first project under `docs/specsmd/`).
4. Build on the `specsmd-skills` branch on top of the existing plugin + validation infrastructure.
