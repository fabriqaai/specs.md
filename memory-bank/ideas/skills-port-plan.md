# Plan: Port specsmd to a Skills-Based Plugin System

**Date**: 2026-08-06 (implemented overnight 2026-08-07)
**Branch**: `specsmd-skills`
**Status**: Implemented through M2 + flow ports (429/429 tests green) — see `skills-port-implementation-notes.md` for what shipped and what remains
**Inputs**: Ideation session `.specs-ideation/sessions/skills-port-20260806/` (spark bank, flame report, concept brief) built on three research reports: skills-ecosystem deep-dive, specsmd architecture map, cross-tool skills/plugin spec survey (Aug 2026).

---

## 1. Why now (one paragraph of evidence)

Between Dec 2025 and mid-2026 the ecosystem converged on the **Agent Skills standard** (agentskills.io): `SKILL.md` + six-field YAML frontmatter, read natively by Claude Code, Codex, Cursor, Copilot, Gemini CLI, Zed, OpenCode, Goose, Amp, Windsurf, Cline, Factory, Kilo. The formats specsmd's 11 installers emit are being deprecated *into* skills by three vendors (Codex: "Custom prompts are deprecated. Use skills"; Cursor deleted its commands docs and ships `/migrate-to-skills`; Copilot: "convert it to an agent skill"). Shipping a full methodology purely as skills is proven in production: mature skills-based plugins run across ten-plus harnesses from a single skills tree, and the ecosystem trend is to collapse slash commands and named agents into skills. specsmd's FIRE and ideation flows are already SKILL.md-shaped; this port migrates the remaining gen-1 flows (AI-DLC, simple) to that shape and replaces per-tool copying with plugin distribution.

## 2. Target architecture

### 2.1 Skill taxonomy per flow (resolves "agents vs skills")

| Current | Becomes | Model-visible? | Notes |
|---|---|---|---|
| Master agent (route-request, analyze-context) | **Dissolved.** Routing = skill descriptions; `specsmd-status` navigator skill for orientation | Yes | In a skills world the description is the router — a separate dispatcher duplicates what the harness already does |
| Inception / Construction / Operations agents | 3 **phase skills** — role framing, forbidden-actions (hard-constraint blocks), checkpoints, handoff chain in body. Personas are dropped by design (accepted decision, 2026-08-06) | Yes | Claude overlay: `context: fork`, `agent: general-purpose` |
| 26 verb skills (intent-create, bolt-plan, bolt-start, deploy…) | 26 **user-invocable skills**, `disable-model-invocation: true` | No | Zero model-context cost; slash/`$` commands in every tool; solves the Codex 8k-char budget |
| project-init, explain-flow, answer-question | Verb skills under `specsmd-core`/flow | No | |
| — (new) | `using-specsmd` **bootstrap meta-skill**, injected by SessionStart hook, with `<SUBAGENT-STOP>` guard | Yes (injected) | Without session-start bootstrap, on-demand skills are dead weight — injection is what makes the methodology reliably engage |

Model-visible descriptions total ~6 × ≤600 chars ≈ half of Codex's 8,000-char budget. Every description is written **trigger-first, never workflow-summarizing** (a documented failure mode: agents follow a summarizing description and skip the body).

### 2.2 What replaces the agent-model mechanisms

| Mechanism today | Replacement |
|---|---|
| Persona adoption via slash command → agent file | **Retired by design** (accepted 2026-08-06: personas no longer needed). Phase skill body carries role framing + constraints; `context: fork` isolation on Claude/Copilot; inline elsewhere |
| Auto-continue chain (context→units→stories→bolt-plan→review) in prose across 5 files | Explicit "REQUIRED NEXT SKILL: X (stop at Checkpoint N)" handoff lines in each skill + **inception ledger** (extend existing `inception-log.md` with chain position) — a compaction/resume-safe execution-ledger pattern |
| `context-config.yaml` declarative context loading | `## Context Preflight` section per skill (required files, purpose, on-missing warn/stop); Claude overlay may upgrade to `` !`command` `` dynamic injection |
| `memory-bank.yaml` ownership/schema | Ships as `specsmd-core` reference (`references/memory-bank.yaml`); phase skills state their write-permissions in-body |
| Bolt-type workflow-as-data | Unchanged in spirit: bolt-type files move to `bolt-start`'s `references/`; still runtime-read |
| `--unit="x" --bolt-id="y"` arguments | Skill `arguments`/`argument-hint` (Claude/Copilot); prose "$ARGUMENTS" handling portable fallback |
| Immutable AI-DLC principles in CLAUDE.md | **AGENTS.md fragment** installed at project root (always-on layer; skills are on-demand); CLAUDE.md symlink; Gemini `context.fileName` opt-in |

### 2.3 Repository & packaging layout

```
plugins/                              # in this monorepo (Open Decision #5)
├── .claude-plugin/marketplace.json   # fabriqaai/specsmd marketplace; metadata.pluginRoot: "./plugins"
├── specsmd-core/
│   ├── .claude-plugin/plugin.json    # + .codex-plugin/, .cursor-plugin/, plugin.json (Copilot reads Claude's too)
│   ├── skills/
│   │   ├── using-specsmd/SKILL.md    # bootstrap meta-skill
│   │   └── specsmd-status/SKILL.md   # navigator (ex-Master)
│   ├── hooks/hooks.json              # SessionStart: inject using-specsmd (matcher: startup|clear|compact)
│   └── agents-md/AGENTS-fragment.md
├── specsmd-aidlc/
│   ├── <4 thin manifests>
│   └── skills/
│       ├── inception/SKILL.md        # phase skill; references/: templates, standards catalog
│       ├── construction/SKILL.md     # references/: bolt-types/*, bolt-template
│       ├── operations/SKILL.md
│       ├── intent-create/SKILL.md    # verb skills, disable-model-invocation
│       ├── bolt-plan/ … (×26)
│       └── */scripts/*.cjs           # bolt-complete, status-integrity, artifact-validator
├── specsmd-fire/        # relocation, minor rework (already SKILL.md-shaped)
├── specsmd-ideation/    # pathfinder — ships first
└── specsmd-simple/      # Open Decision #2
```

- **Version sync**: one version propagated across all manifests by a single-source bump script.
- **Composite**: optional `specsmd-full` plugin via marketplace symlink dereferencing.
- **Naming rules** (CI-enforced): lowercase-hyphen names, no `/` or `:` (Copilot silent-fail), name == directory name, six spec fields only in portable core; extras (`when_to_use`, `context: fork`, `paths`, `hooks`) in Claude overlay applied at publish time.

### 2.4 Versioning & backward compatibility (decision 2026-08-06: do not break existing users)

- **Plugins are versioned independently** of the npm package: each plugin carries semver in its manifests (starting `1.0.0`), propagated by the single-source bump script; every skill also records `metadata.version`. Marketplace updates are opt-in/harness-managed — existing installs never mutate in place.
- **The old path keeps working untouched**: `npx specsmd install` continues to emit the current `.specsmd/` + per-tool command layout for a deprecation window; the skills plugins are a parallel, additive channel. No file the old installer wrote is modified or removed by the new one.
- **Artifact compatibility is the hard contract**: `memory-bank/` schema and frontmatter state machines do not change shape in v1 of the plugins, so projects started under the agent-based system continue seamlessly under skills (and the VS Code extension/dashboard keep reading them).
- A `compatibility` note in each skill records the minimum artifact-schema version it understands; any future schema change bumps plugin major.

### 2.5 Installation channels

1. **Native marketplaces (primary)**: `/plugin marketplace add fabriqaai/specsmd` (Claude), `codex plugin marketplace add` (near-identical format), Cursor marketplace, VS Code (auto-detects Claude manifest), Gemini extension manifest.
2. **npm bootstrapper (compat)**: `npx specsmd install` rewritten to emit one `.agents/skills/` tree (read natively by ~10 tools), symlink `.claude/skills → .agents/skills`, write AGENTS.md fragment, keep `dashboard`/`dashboard-cli`. The 11 hand-rolled adapters (zero tests, emitting deprecated formats) are retired; long-tail rules/commands conversion delegated to `rulesync` if kept at all (Open Decision #4).
3. **Registries**: skills.sh, `gh skill publish`, anthropics marketplace submission.

## 3. Milestones

### M0 — Decisions + scaffolding (small)
- Resolve the open decisions (§5). Create `plugins/` scaffold, marketplace.json, bump-version script, CI validation (spec-frontmatter lint via `skills-ref validate`, name rules, path integrity).
- **Flow unification study (AI-DLC × FIRE)**: ✅ done — see `memory-bank/research/aidlc-fire-unification-study.md`. Recommendation: **Option B — shared core + two thin methodology profiles** (full merge blocked by AWS-fidelity constraints; staying separate lets duplication compound). Its Phase 4 (converge all flows on `agents/<agent>/skills/<skill>/SKILL.md`) aligns exactly with this port's target layout, so the two efforts share M2 groundwork. Final call is Open Decision #6.

### M1 — Pathfinder: `specsmd-ideation` (small; validates everything end-to-end)
- Relocate ideation (already SKILL.md + frontmatter; 1 agent, 3 skills, shared protocols → `references/`). Author trigger-first descriptions. Orchestrator agent.md folds into a thin `ideation` phase skill.
- Dev loop via skills-directory plugins (`claude plugin init` → `~/.claude/skills/`, live reload). Acceptance: install from marketplace in a clean project; "help me brainstorm X" triggers spark; session artifacts land in `.specs-ideation/`.

### M2 — Flagship: `specsmd-aidlc` (the real port)
- Codemod: 26 gen-1 skills → `skills/<name>/SKILL.md` dirs (Goal/Input/Process bodies preserved; `## Test Contract` kept). Hand-author all descriptions.
- Write 3 phase skills + `specsmd-status` + `using-specsmd` bootstrap + SessionStart hook.
- Handoff chain + inception ledger; Context Preflight sections replace `context-config.yaml`; templates/bolt-types/scripts into `references/`/`scripts/`; fix the 166 hardcoded `.specsmd/...` paths to skill-relative.
- **Fix-forward**: repair the 19 broken command paths, phantom `operations/menu.md`+`rollback.md`, repo-relative path in construction command, drifted `.claude/commands/`, dead `dummyConfig` — with new tests so they can't silently regress.
- Update schema tests: agent.schema/skill.schema → SKILL.md spec validation.
- Acceptance: clean session, "build me a todo app" → inception triggers (not raw code); full inception run stops at exactly the 4 checkpoints; bolt start/complete round-trips status cascade via bundled scripts.

### M3 — Long tail + installer rewrite
- `specsmd-fire`, `specsmd-simple` (per decision). Rewrite `installer.js` as bootstrapper; retire adapters; add installer tests (currently zero). Keep `.specsmd/` emission during a deprecation window.
- VS Code extension: add new paths to activation events + `boltTypeParser` search paths; fix `FlowId` union + clipboard invocation strings. Dashboard `flow-detect.js` drift fix.

### M4 — Distribution + docs
- Publish marketplace; submit to skills.sh / gh skill / official marketplaces. Docs site: new install pages, per-tool matrix, migration guide for existing `npx` users. Dogfood: replace this repo's `.claude/commands/` + `.specsmd/` symlinks with the plugins themselves.
- Minimal trigger-eval harness in CI (canonical prompts → expected skill), expanding later.

## 4. Risks (top 5, with mitigations)

1. **Mis-triggering replaces mis-routing** — few model-visible skills, trigger-first descriptions, bootstrap precedence rules, CI trigger evals.
2. **Phase-constraint enforcement without personas** (persona switching itself is retired by design — accepted 2026-08-06) — hard forbidden-action blocks in each phase skill; `context: fork` where available; ledger makes wrong-phase actions detectable.
3. **Chain breakage on compaction/resume** — ledger + explicit handoffs; acceptance test for checkpoint fidelity.
4. **VS Code extension / existing-user breakage** — memory-bank layout unchanged; transition window with `.specsmd/` still emitted; extension patched in M3.
5. **AI-DLC fidelity drift** — bodies ported mechanically; any methodology-text change reviewed against `resources/ai-dlc-specification.md`; no new concepts (per CLAUDE.md directives).

## 5. Open decisions

Defaults applied during the autonomous implementation run (2026-08-07, overnight) — each reversible and flagged for user review:

1. **Plugin naming**: `specsmd-` prefixed (`specsmd-core`, `specsmd-aidlc`, `specsmd-fire`, `specsmd-ideation`, `specsmd-simple`) — explicit, brand-consistent, collision-safe. ✅ applied
2. **`simple` flow**: ported (additive, cheap); retirement remains a product call. Its verb skills renamed `spec-*` to avoid cross-flow collisions. ✅ applied
3. **Verb-skill scope v1**: all verb skills ported as user-invocable (`disable-model-invocation: true`) — zero model-context cost. ✅ applied
4. **Long-tail tools**: old `npx specsmd install` path left completely untouched (guaranteed compat); no rulesync dependency added yet. ✅ applied
5. **Source location**: `plugins/` in this monorepo; marketplace at `plugins/.claude-plugin/marketplace.json`. ✅ applied
6. **AI-DLC × FIRE unification**: whether to adopt the study's recommendation (`memory-bank/research/aidlc-fire-unification-study.md` — Option B: shared runtime core + two thin methodology profiles; artifact roots and vocabularies unchanged). Affects plugin boundaries: under Option B, `specsmd-core` grows the shared engine (state scripts, resume/phase guards, code review, integrity, walkthrough) and `specsmd-aidlc`/`specsmd-fire` become the profiles. Sub-decision flagged for the user: whether FIRE's `autonomy_bias` may optionally relax AI-DLC's per-stage gates (weakens "AI Plans, Human Validates" — if at all: opt-in, off by default). **Deliberately NOT executed in the overnight run** — this remains the user's call; the plugin boundaries chosen are compatible with Option B if adopted.

### Resolved decisions (2026-08-06)

- **Personas retired**: persona switching is not needed in the skills model; phase skills carry role framing + hard constraints only.
- **Versioning to protect existing users**: independent plugin semver, parallel distribution, no in-place mutation of existing installs, `memory-bank/` schema frozen for v1 (§2.4).

## 6. What does NOT change

- The AI-DLC methodology itself: three phases, mob rituals, bolt semantics ("hours or days"), DDD stages, checkpoints, AI-drives-human-validates.
- `memory-bank/` artifact model (intents → units → stories → bolts) and all frontmatter state machines.
- The dashboard and VS Code extension's role as read-only visualizers of `memory-bank/`.
- Noun-verb command naming (`bolt-start`, `intent-create`) — now enforced as skill names.
