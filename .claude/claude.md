# Claude Instructions for specsmd Development

## Product Direction: The Unified Bolt Flow

**Decision (2026-08-09)**: AI-DLC and FIRE are being unified into a single skills-native flow — the **Unified Bolt Flow**. The legacy `aidlc` and `fire` flows are **frozen** for existing users; new development targets the unified flow.

**Branching**: v1 is immutable forever on its own branch and the current npm package. All v2/skills work happens on the **`main-v2`** branch. The website deploys from `main-v2` and carries both doc sets — legacy docs at their existing URLs (never break them; SEO), unified-flow docs under `/v2`.

Full concept: `.specs-ideation/sessions/aidlc-fire-unification-20260809/concept-briefs/unified-bolt-flow.md`
Background study: `memory-bank/research/aidlc-fire-unification-study.md`

### Unified flow principles (locked user decisions)

1. **FIRE-shaped core, AI-DLC vocabulary**: hierarchy is Intent → Work Item; the execution container is a **bolt** — created dynamically at any time, grouping one or more work items. Upfront bolt planning is available as optional *draft bolts*, never required.
2. **Recipes, not bolt types**: stage catalogs (`default`, `ddd`, `spike`, `simple`) are data files chosen at bolt creation, not at planning time.
3. **Recommend, don't enforce**: skills never force sequences. Recommendation lives in exactly three places — navigator/status skill, skill descriptions, templates. Scripts gate on state prerequisites only (e.g., no bolt completion without a test report), never on phase or order.
4. **Ceremony dial**: gates come from complexity × autonomy bias (autopilot / confirm / validate). "AI plans, human validates" is the controlled end of the dial.
5. **Phases are lenses, not modes**: Inception/Construction/Operations survive as status *views* (shaping / building / shipping), not as gated modes.
6. **State in frontmatter, not state.yaml**: no central state file. State lives in artifact YAML frontmatter (AI-DLC style) — `bolt.md` carries status, recipe, current_stage, stages_completed, checkpoint_state; work items and intent briefs carry their own status. Scripts are the only writers; the cascade (bolt → work items → intent) and an integrity validator reconcile drift.
7. **Artifact root is `docs/specsmd/`**: a visible docs folder (intents/, bolts/, recipes/, standards/, decisions/) — specs are browsable project documentation, not hidden tool state.
8. **Delivery is skills-native**: Agent Skills plugins (see `plugins/`); verb skills carry `disable-model-invocation: true`; minimal model-invocable descriptions.
9. **Plugin naming**: the unified flow ships as the **`specsmd`** plugin (the default install — it IS the AI-DLC v2 implementation). Companion flows are separate `specsmd-*` plugins (`specsmd-simple`, `specsmd-ideation`, …). Existing `specsmd-aidlc` / `specsmd-fire` plugins stay published and frozen as legacy v1 channels.

### Forbidden in unified-flow work

- ❌ Introducing sequence enforcement in skills (chains, "REQUIRED NEXT SKILL", phase gates)
- ❌ Adding a central state file
- ❌ Hardcoding recipe stages in scripts or skills (recipes are data)
- ❌ Mutating artifact state outside the owning scripts
- ❌ Naming competitor tools in repo documents

---

## Legacy AI-DLC Flow: Strict AWS Fidelity (frozen)

The rules in this section apply **only when modifying the legacy flow** (`src/flows/aidlc/`), which is frozen for existing users — bug fixes only, no new features, no concept changes.

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
