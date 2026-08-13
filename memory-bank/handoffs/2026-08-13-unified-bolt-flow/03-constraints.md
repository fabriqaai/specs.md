# Constraints and locked decisions

These bind any continuation. They are the 2026-08-09 Unified Bolt Flow decisions plus execute-plan user instructions. Do not “simplify” them away.

## Branching and release

- v1 lives forever on **`main`** and the current npm package. Full maintenance, **no new features**.
- All v2 / skills / unified-flow work is on **`main-v2`** (and stacks whose parent is `main-v2`).
- Website deploys from `main-v2` and must keep **legacy URLs**. Unified docs go under `/v2`.
- **No v2 npm CLI.** Marketplace-only (Claude Code + Codex). Marketplace-less tools get a documented **manual `cp` path**.
- **No migration tooling, ever.** Legacy users stay on v1.
- Plugin name: **`specsmd`** — self-contained (absorbs bootstrap + navigator). Companion flows are separate `specsmd-*` plugins (v1 channels stay published).
- Commits: semantic-release style. `<type>: <description>` lowercase type, present tense. `feat:` / `fix:` / `perf:` bump; `docs:` / `chore:` / `refactor:` / `test:` do not.

## Unified flow — locked user decisions

1. **FIRE-shaped core, AI-DLC vocabulary.** Intent → Work Item. Execution container is a **bolt**, created dynamically. Upfront planning = optional *draft bolts*, never required.
2. **Recipes, not bolt types.** Stage catalogs (`default`, `ddd`, `spike`, `simple`) are **data files** chosen at bolt creation.
3. **Recommend, don’t enforce.** Skills never force sequences. Recommendation lives in exactly three places: navigator/status, skill descriptions, templates. Scripts gate on **state prerequisites** only (e.g. no bolt complete without required evidence), never on phase or order.
4. **Ceremony dial.** Gates from complexity × autonomy bias (`autopilot` / `confirm` / `validate`). “AI plans, human validates” is the controlled end.
5. **Phases are lenses, not modes.** Inception / Construction / Operations survive as status *views* (shaping / building / shipping).
6. **State in frontmatter, not `state.yaml`.** `bolt.md` carries status, recipe, current_stage, stages_completed, checkpoint_state. Work items and intent briefs carry their own status. **Scripts are the only writers.** Cascade bolt → work items → intent + integrity validator reconcile drift.
7. **Artifact root is `docs/specsmd/`.** Visible docs: intents/, bolts/, recipes/, standards/, decisions/.
8. **Skills-native delivery.** Verb skills carry `disable-model-invocation: true`. Minimal model-invocable surface: bootstrap (`using-specsmd`) + navigator (`specsmd-status`).
9. **Intents and work items are nlspecs.** Observable behavior only. No mechanism, no code, no implementation file names. Dividing question: “does this decision affect correctness or interoperability?” Every spec ends in a behavioral Definition of Done with gating vs advisory. Spec is source of truth; code is derived.
10. **Harness carries technical opinions.** Standards are invariants with a tiered escalation ladder. Guardrail failures speak in remediation (what, where, which standard). Completion is **goal-gated by the state layer**, not by skill prose.
11. **Evals first.** Verifiers exist before flow implementation. See `02-evals-decisions.md` for the gap between this rule and what shipped.
12. Status vocabulary in the implementation: **`draft | pending | active | complete | abandoned`**. Never `in-progress` (the concept brief still says `in-progress` in one place — the code won).

## Forbidden (unified-flow work)

- Sequence enforcement in skills (chains, “REQUIRED NEXT SKILL”, phase gates)
- A central state file
- Hardcoding recipe stages in scripts or skills (recipes are data)
- Mutating artifact state outside the owning scripts
- Naming competitor tools in **new** repo documents (legacy compare pages keep their URLs and content)
- Code snippets, implementation file names, or internal mechanism in intents / work items
- Implementing a work item whose spec has not passed a sufficiency check (evals-first) — **already violated for 001–012**; do not make it worse without a human call
- A single contribution that touches both `evals/` (or the holdout workflow) and `plugins/specsmd/`
- Merging PRs from the agent
- Force-push without `--force-with-lease`
- Committing v2 work onto `main`

## Status / ceremony / recipes (as implemented on the tip)

- Recipe snapshot is **immutable** on the bolt after create.
- Spike time box: PT8H default; expiry surfaces in status / complete path.
- Goal-gated complete: missing required evidence is a terminal script error with remediation, not a skill sermon.
- Integrity finding for orphans is **`ORPHAN_REF`** (not `ORPHAN_WORK_ITEM` — stacked tests were fixed to match).
- Init asks **exactly one** question (autonomy bias).
- Confirm-before-record for inferred standards. `--standards-json '{}'` must not bypass confirm. Reserved scope name `root` rejected.
- Memory: semantic vs episodic by status. Archive must not move active semantic truth. Horizon uses last activity, not `created`.

## Legacy AI-DLC (only if you touch `src/flows/aidlc/`)

Frozen. Three phases only. Mob rituals. Bolt duration “hours or days.” DDD integral. Phases sequential, not iterative. Do not invent AI-DLC concepts that are not in `/resources/aidlc.pdf`. This execute-plan did **not** change the legacy flow.

## How this repo dogfoods (today)

```
.specsmd/aidlc/     → symlink to src/flows/aidlc/   (legacy)
memory-bank/        → this repo’s own legacy artifacts
plugins/            → v1 plugins on main-v2; unified plugin only on the stack
.claude/commands/   → legacy slash commands
```

Unified-flow dogfood under `docs/specsmd/` was deferred (“forget dogfood for now”).

## Tests

| Project | Command |
|---|---|
| NPM / plugins / evals | `cd src && npm run test` |
| Full validation | `cd src && npm run validate:all` |
| VS Code extension | `cd vs-code-extension && npm run test` |

Plugin names in `src/__tests__/plugins-validation.test.ts` include `specsmd` **on the stack**. On current `main-v2` that may not be true until the stack is merged.

## Key source-of-truth files

| Topic | Path | On |
|---|---|---|
| This packet | `HANDOFF.md` + `memory-bank/handoffs/2026-08-13-unified-bolt-flow/` | `main-v2` after this commit |
| Concept | `.specs-ideation/sessions/aidlc-fire-unification-20260809/concept-briefs/unified-bolt-flow.md` | `main-v2` |
| Unification study | `memory-bank/research/aidlc-fire-unification-study.md` | `main-v2` |
| Nlspec research | `memory-bank/research/nlspec-harness-study.md` | `main-v2` |
| Nlspec standard | `docs/specsmd/standards/nlspec.md` | `main-v2` |
| Intent + work items | `docs/specsmd/intents/001-unified-bolt-flow/` | `main-v2` (specs) |
| PR plan | `docs/specsmd/decisions/002-unified-flow-pr-plan.md` | **stack only** |
| Agent rules | `.claude/CLAUDE.md` | `main-v2` |
| Glossary / terms | `memory-bank/glossary.md`, `memory-bank/term-mappings.md` | `main-v2` |
