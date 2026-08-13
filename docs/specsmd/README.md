# docs/specsmd — specsmd flow memory bank

This is the memory bank of the **specsmd flow**. These artifacts are the source of truth; code is derived from them.

Concept: `.specs-ideation/sessions/aidlc-fire-unification-20260809/concept-briefs/unified-bolt-flow.md`

## Layout

| Path | Purpose |
|---|---|
| `system/` | **Current truth** — registered semantic docs (architecture, integrations, domain facts) + verification status. Read first. |
| `intents/{id}/` | One change: `brief.md`, `tasks.md` (all slices), and `bolts/` (semantic while active, episodic once complete) |
| `recipes/` | Stage catalogs as data (default, ddd, spike, simple) |
| `standards/` | Constitution + project standards (hierarchical monorepo overrides) |
| `decisions/index.md` | Discovery index: title, summary, consult-when, path to the decision file |
| `intents/{id}/bolts/{bolt}/decisions/` | Decision records for that bolt (immutable events) |

**Read path**: semantic first — `system/`, `standards/`, the decisions index. Episodic artifacts are history; each carries an upward pointer to current truth and is read only when a semantic doc directs there or history is explicitly wanted.

## Ground rules

- Every intent and work item is an **nlspec** — see `standards/nlspec.md`: observable behavior with engineering-grade precision; no mechanism, no code, no implementation file names. The spec is the source of truth; code is derived.
- State lives in artifact frontmatter — there is no central state file.
- **Skills write state** following `plugins/specsmd/skills/flow-runtime/references/transitions.md`. There are no state scripts. Install locally with `/plugin marketplace add <path-to-this-repo>` then `/plugin install specsmd@specsmd` — only when asked. Marketplace-less tools: copy `plugins/specsmd/skills/*` into `.agents/skills/`.
- Bolts are created when work starts, not planned upfront (draft bolts are optional proposals).
- Nothing here enforces sequence; skills recommend, state gates. Guardrail failures speak in remediation instructions.
- Evals and verifiers precede implementation (work item 000).
