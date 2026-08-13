# Claude Instructions for specsmd Development

## Product Direction: The Unified Bolt Flow

**Decision (2026-08-09)**: AI-DLC and FIRE are being unified into a single skills-native flow — the **Unified Bolt Flow**. The legacy `aidlc` and `fire` flows are **frozen** for existing users; new development targets the unified flow.

**Branching**: v1 lives forever on `main` and the current npm package (full maintenance, no features). All v2/skills work happens on the **`main-v2`** branch; `main-v2` becomes the repo's default branch at v2 public launch. The website deploys from `main-v2` and carries both doc sets — legacy docs at their existing URLs (never break them; SEO), unified-flow docs under `/v2`.

Full concept: `.specs-ideation/sessions/aidlc-fire-unification-20260809/concept-briefs/unified-bolt-flow.md`
Background study: `memory-bank/research/aidlc-fire-unification-study.md`

### Unified flow principles (locked user decisions)

1. **FIRE-shaped core, AI-DLC vocabulary**: hierarchy is Intent → Work Item; the execution container is a **bolt** — created dynamically at any time, grouping one or more work items. Upfront bolt planning is available as optional *draft bolts*, never required.
2. **Recipes, not bolt types**: stage catalogs (`default`, `ddd`, `spike`, `simple`) are data files chosen at bolt creation, not at planning time.
3. **Recommend, don't enforce**: skills never force sequences. Recommendation lives in exactly three places — navigator/status skill, skill descriptions, templates. Scripts gate on state prerequisites only (e.g., no bolt completion without a test report), never on phase or order.
4. **Ceremony dial**: gates come from complexity × autonomy bias (autopilot / confirm / validate). "AI plans, human validates" is the controlled end of the dial.
5. **Phases are lenses, not modes**: Inception/Construction/Operations survive as status *views* (shaping / building / shipping), not as gated modes.
6. **State in frontmatter, not state.yaml**: no central state file. The memory bank is `docs/specsmd/`. State lives in artifact YAML frontmatter — `bolt.md` carries status, recipe, current_stage, stages_completed, checkpoint_state; work items and intent briefs carry their own status. **Skills write those fields** following `flow-runtime/references/transitions.md`. Scripts are optional helpers, not required gates. The cascade (bolt → work items → intent) is applied by the completing skill.
7. **Artifact root is `docs/specsmd/`**: a visible docs folder (intents/, bolts/, recipes/, standards/, decisions/) — specs are browsable project documentation, not hidden tool state.
8. **Delivery is skills-native**: Agent Skills plugins (see `plugins/`); verb skills carry `disable-model-invocation: true`; minimal model-invocable descriptions.
9. **Plugin naming & distribution**: the product name is the **specsmd flow**, shipped as the **`specsmd`** plugin (self-contained). Companion v1 flows stay `specsmd-*`. Distribution is marketplace-only; no v2 npm CLI. **No migration tooling, ever.**
10. **Intents and work items are nlspecs** (`docs/specsmd/standards/nlspec.md`): natural language with engineering-grade precision about *observable behavior* — never mechanism, code, or implementation file names. The dividing question is "does this decision affect correctness or interoperability?" Every spec ends in a behavioral Definition of Done with gating vs. advisory criteria. The spec is the source of truth; code is derived from it.
11. **Harness carries the technical opinions**: standards are invariants. Skills refuse illegal transitions in prose (what is missing, which field, which rule). Completion is goal-gated by the skill that writes `complete` — required evidence must exist; there is no required script.
12. **Evals first**: verifiers (spec-sufficiency triangulation, DoD conformance with honest coverage, trigger evals, holdout scenarios) exist before flow implementation starts. Research: `memory-bank/research/nlspec-harness-study.md`.

### Forbidden in unified-flow work

- ❌ Introducing sequence enforcement in skills (chains, "REQUIRED NEXT SKILL", phase gates)
- ❌ Adding a central state file
- ❌ Hardcoding recipe stages in scripts or skills (recipes are data)
- ❌ Mutating artifact state outside the owning skill (or an optional helper that skill names)
- ❌ Naming competitor tools in repo documents
- ❌ Code snippets, implementation file names, or internal mechanism in intents/work items (nlspec violation)
- ❌ Implementing a work item whose spec has not passed a sufficiency check (evals-first)

---

## Legacy AI-DLC Flow: Strict AWS Fidelity (frozen)

The rules in this section apply **only when modifying the legacy flow** (`src/flows/aidlc/`), which is frozen for existing users — full maintenance continues (bug fixes, dependency/security updates, compatibility fixes; the open dependabot findings are triaged on v1), but no new features and no concept changes.

**Core Principle**: The legacy flow implements AI-DLC as defined by AWS, not our own version of it.

### Required reading before legacy changes (in order)

1. **AI-DLC Specification** — `/resources/aidlc.pdf` (original), `/resources/ai-dlc-specification.md` (readable). The authoritative source; if it's not in the spec, it's not AI-DLC.
2. **`/src/flows/aidlc/agents/`** — Master, Inception, Construction, Operations agents.
3. **`/src/flows/aidlc/`** — memory-bank.yaml, context-config.yaml, skills, templates.
4. **`/memory-bank/`** — PRFAQ, glossary, term-mappings, intents, standards.

### Immutable principles (legacy flow only)

1. Three phases only: Inception → Construction → Operations
2. Mob rituals: Mob Elaboration (Inception), Mob Construction (Construction)
3. Bolt duration: "hours or days" (flexible, NOT fixed)
4. DDD is integral to AI-DLC
5. Phases are sequential, NOT iterative (execution within Construction is iterative)
6. AI drives, human validates

### Forbidden in legacy-flow work

- ❌ Inventing or modifying AI-DLC concepts not in the PDF
- ❌ Adding phases; changing "hours or days" to fixed durations
- ❌ Terms like "Discovery Bolt" / "Design Bolt" (not in AI-DLC)
- ❌ Making phases iterative
- ❌ Invoking Bolt commands outside Construction Agent context

---

## Where to Find Specifications

| Topic | File Location |
|-------|---------------|
| **Unified flow concept** | `.specs-ideation/sessions/aidlc-fire-unification-20260809/concept-briefs/unified-bolt-flow.md` |
| **Unification study** | `memory-bank/research/aidlc-fire-unification-study.md` |
| **Skills port plan** | `memory-bank/ideas/skills-port-plan.md` |
| **Plugins** | `plugins/` (specsmd-core, -aidlc, -fire, -ideation, -simple) |
| **Term Mappings** | `/memory-bank/term-mappings.md` |
| **Glossary** | `/memory-bank/glossary.md` |
| **PRFAQ** | `/memory-bank/PRFAQ.md` |
| **Standards** | `/memory-bank/standards/` |
| **Legacy agent implementation** | `/src/flows/aidlc/agents/` |
| **Legacy FIRE flow** | `/src/flows/fire/` |

**Conventions**: commands use the noun-verb pattern (e.g., `bolt-start`, `intent-create`). Point to specs rather than duplicating content. Check `/memory-bank/glossary.md` for terminology. If uncertain about methodology, ask rather than invent.

---

## Project Context

- **Company / Project**: specsmd (all lowercase) — https://specs.md
- **Primary Focus**: spec-driven development flows for AI-native engineers

---

## Dogfooding

specsmd is built using its own flows.

```
specsmd/
├── .specsmd/aidlc/    → symlink to src/flows/aidlc/  (legacy flow definitions)
├── memory-bank/       → this repo's own artifact storage (legacy schema)
├── plugins/           → Agent Skills plugins (the new delivery mechanism)
└── .claude/commands/  → slash commands for legacy agents
```

Legacy slash commands: `/specsmd-master-agent`, `/specsmd-inception-agent`, `/specsmd-construction-agent`, `/specsmd-operations-agent`. Ideation: `/specsmd-ideation` (sessions in `.specs-ideation/sessions/`).

The unified flow will dogfood under `docs/specsmd/` once it exists.

---

## Git Commit Messages (Semantic Versioning)

This project uses **semantic-release**. Format: `<type>: <description>` (lowercase type, present tense).

| Type | Version Impact |
|------|----------------|
| `feat:` | Minor bump |
| `fix:`, `perf:` | Patch bump |
| `docs:`, `chore:`, `refactor:`, `style:`, `test:` | No release |

Major versions are manual (`package.json`). See `/dev_release_guide.md`.

---

## Testing Requirements

**MANDATORY**: run tests for any project you changed before considering work complete.

| Project | Command | Framework |
|---------|---------|-----------|
| NPM package (`src/`) | `cd src && npm run test` | Vitest |
| VS Code extension | `cd vs-code-extension && npm run test` | Mocha |

Plugin format rules are tested in `src/__tests__/plugins-validation.test.ts`. Full validation: `cd src && npm run validate:all`.

- Do NOT commit with failing tests; do NOT skip tests without explicit user approval.
- Report failures with clear error messages.

---

*Last updated: 2026-08-09 — rescoped strict AI-DLC fidelity to the frozen legacy flow; added Unified Bolt Flow direction.*
