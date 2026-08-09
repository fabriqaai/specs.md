# docs/specsmd — Unified Bolt Flow artifacts

This is the artifact root of the **Unified Bolt Flow** (specsmd v2 / AI-DLC v2) — and its first project is building the flow itself. These artifacts are hand-authored in the exact shape the flow defines, so the design is dogfooded before the tooling exists.

Concept: `.specs-ideation/sessions/aidlc-fire-unification-20260809/concept-briefs/unified-bolt-flow.md`

## Layout

| Path | Purpose |
|---|---|
| `intents/{id}/` | Intent brief + work items (status in YAML frontmatter) |
| `bolts/{id}/` | Execution containers: bolt.md, plan.md, test-report.md, walkthrough.md |
| `recipes/` | Stage catalogs as data (default, ddd, spike, simple) |
| `standards/` | Constitution + project standards (hierarchical monorepo overrides) |
| `decisions/` | ADRs + "Read when" index |

## Ground rules

- Every intent and work item is an **nlspec** — see `standards/nlspec.md`: observable behavior with engineering-grade precision; no mechanism, no code, no implementation file names. The spec is the source of truth; code is derived.
- State lives in artifact frontmatter — there is no central state file.
- The flow's tooling is the only state writer once it exists; until then, edits are manual and deliberate.
- Bolts are created when work starts, not planned upfront (draft bolts are optional proposals).
- Nothing here enforces sequence; skills recommend, state gates. Guardrail failures speak in remediation instructions.
- Evals and verifiers precede implementation (work item 000).
