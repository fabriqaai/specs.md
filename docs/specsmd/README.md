# docs/specsmd — Unified Bolt Flow artifacts

This is the artifact root of the **Unified Bolt Flow** (specsmd v2 / AI-DLC v2) — and its first project is building the flow itself. These artifacts are hand-authored in the exact shape the flow defines, so the design is dogfooded before the tooling exists.

Concept: `.specs-ideation/sessions/aidlc-fire-unification-20260809/concept-briefs/unified-bolt-flow.md`

## Layout

| Path | Purpose |
|---|---|
| `system/` | **Current truth** — registered semantic docs (architecture, integrations, domain facts) + verification status. Read first. |
| `intents/{id}/` | Change records: intent brief + work items (semantic while active, episodic once complete) |
| `bolts/{id}/` | Execution containers: bolt.md, plan.md, test-report.md, walkthrough.md (episodic once complete) |
| `recipes/` | Stage catalogs as data (default, ddd, spike, simple) |
| `standards/` | Constitution + project standards (hierarchical monorepo overrides) |
| `decisions/` | Decision records (immutable events) + the in-force index (semantic — consult the index, don't crawl the folder) |

**Read path**: semantic first — `system/`, `standards/`, the decisions index. Episodic artifacts are history; each carries an upward pointer to current truth and is read only when a semantic doc directs there or history is explicitly wanted.

## Ground rules

- Every intent and work item is an **nlspec** — see `standards/nlspec.md`: observable behavior with engineering-grade precision; no mechanism, no code, no implementation file names. The spec is the source of truth; code is derived.
- State lives in artifact frontmatter — there is no central state file.
- The flow's tooling (the `specsmd` plugin's `flow-runtime` scripts) is the only state writer. Install locally with `/plugin marketplace add <path-to-this-repo>` then `/plugin install specsmd@specsmd`. Marketplace-less tools: copy `plugins/specsmd/skills/*` into `.agents/skills/` (verbatim path in `plugins/README.md`).
- Bolts are created when work starts, not planned upfront (draft bolts are optional proposals).
- Nothing here enforces sequence; skills recommend, state gates. Guardrail failures speak in remediation instructions.
- Evals and verifiers precede implementation (work item 000).
