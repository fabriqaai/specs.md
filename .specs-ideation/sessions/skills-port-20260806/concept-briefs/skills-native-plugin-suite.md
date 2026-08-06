# Concept Brief — specsmd as a Skills-Native Plugin Suite

**Session**: skills-port-20260806
**Shaped**: 2026-08-06 via Disney Strategy (Dreamer → Realist → Critic)
**Status**: Draft — Critic mitigations need user validation (see Open Decisions)

---

## The Concept (one paragraph)

specsmd stops being an installer that copies agent files into eleven tool-specific command formats, and becomes a **suite of plugins built on the Agent Skills standard**: one marketplace repo (`fabriqaai/specsmd`), one plugin per flow (`specsmd-aidlc`, `specsmd-fire`, `specsmd-ideation`, `specsmd-simple`) on a shared `specsmd-core`, each plugin a single `skills/` tree with thin per-tool manifests. Skills install once into `.agents/skills/` and run natively in Claude Code, Codex, Cursor, Copilot, Gemini, Zed and ~5 more tools. The methodology itself (AI-DLC phases, checkpoints, artifacts in `memory-bank/`) is unchanged — only the delivery mechanism moves.

## Dreamer — the ambitious version

- `claude` user types `/plugin marketplace add fabriqaai/specsmd` and thirty seconds later "build me an inventory service" triggers Inception, which produces intents/units/stories in `memory-bank/` with named checkpoints — no npx, no copied files, auto-updating.
- A Codex user types `$bolt-status`; a Cursor user gets the same skill; a Zed user too — one artifact model, ten tools, zero per-tool code.
- specsmd becomes *the* spec-driven-development entry in every plugin marketplace (claude-plugins-official, skills.sh, gh skill).
- The dashboard and VS Code extension read the same `memory-bank/`, unchanged — the visualization layer was already decoupled.
- New methodologies (or community flows) are just new plugins in the marketplace: the "pluggable framework" claim in the docs becomes literally true.

## Realist — how it actually works

**Skill architecture (per flow plugin):**
- **Model-invocable skills** (in every tool's trigger budget, ~6 total): `inception`, `construction`, `operations` (phase skills, Claude overlay: `context: fork`, `agent: general-purpose`), `specsmd-status` (navigator, replaces Master's analyze/route), plus core's `using-specsmd` bootstrap.
- **User-invocable verb skills** (`disable-model-invocation: true`, zero model-context cost): the 26 ported verbs — `intent-create`, `bolt-plan`, `bolt-start`, `deploy`, … invoked as slash/`$` commands.
- Phase skills carry: role framing (personas retired by design — accepted 2026-08-06), hard forbidden-action blocks, checkpoint definitions, explicit handoff chain ("REQUIRED NEXT SKILL"), and a `## Context Preflight` section replacing `context-config.yaml`.
- An **inception ledger** (`memory-bank/intents/<intent>/inception-log.md`, already exists — extended with chain position) makes the auto-continue chain compaction/resume-safe.
- Templates + bolt-types move to `references/`/`assets/` inside the owning skill directory; `memory-bank.yaml` becomes a core reference; helper `.cjs` scripts ship in `scripts/` and are invoked via `${CLAUDE_SKILL_DIR}` (Claude) / relative path (others).
- Frontmatter: strict six-field spec (`name`, `description`, `license`, `compatibility`, `metadata{version,phase,flow}`, `allowed-tools`); Claude-only fields live in an overlay applied at build/publish time for the Claude channel.

**Packaging:**
- Marketplace repo with `plugins/{specsmd-core,specsmd-aidlc,specsmd-fire,specsmd-ideation,specsmd-simple}/`, each with `skills/` + 4 thin manifests; `.claude-plugin/marketplace.json` with `metadata.pluginRoot`.
- `specsmd-core`: `using-specsmd` bootstrap skill + SessionStart hook (with `<SUBAGENT-STOP>`), `specsmd-status`, shared output standards, AGENTS.md fragment.
- npm `specsmd` package becomes bootstrapper: writes `.agents/skills/`, symlinks `.claude/skills`, installs AGENTS.md fragment, keeps `dashboard`; adapters retired (long tail → rulesync).

**Sequence:** pathfinder (`specsmd-ideation`, already skill-shaped) → flagship (`specsmd-aidlc`, the real port) → `fire`/`simple` + installer rewrite → distribution (marketplaces, skills.sh, docs).

## Critic — risks and mitigations

| Concern | Mitigation |
|---|---|
| **Triggering replaces routing — and may misfire** (model jumps to construction when user says "build X", violating phase order) | Only ~6 model-invocable descriptions, authored trigger-first; bootstrap skill states phase precedence; minimal trigger evals in CI (canonical prompts must select inception) |
| **Phase constraints without persona switching** (accepted: personas retired by design; skills are additive, so a loaded construction skill doesn't erase inception constraints) | Forbidden-actions become explicit hard-constraint blocks in each phase skill; Claude overlay uses `context: fork` for true isolation; checkpoints written into the ledger so a wrong-phase action is detectable |
| **Auto-continue chain breaks without an orchestrator** | Explicit handoff lines + ledger; acceptance test: full inception run stops exactly at the 4 checkpoints |
| **VS Code extension / dashboard breakage** (activation on `.specsmd/`, boltTypeParser reads old template paths, clipboard strings) | memory-bank/ layout unchanged (the extension's main input); add `.agents` + plugin cache paths to activation events and parser search paths in the flagship milestone; keep `.specsmd/` bootstrapper output during transition |
| **Existing users on the npx path** | Bootstrapper keeps `npx specsmd install` working and emits the same skills tree; deprecation window, not a cliff |
| **AI-DLC fidelity drift during rewrite** (CLAUDE.md forbids inventing concepts) | Port is mechanical on bodies (Goal/Input/Process preserved); methodology text changes reviewed against `resources/ai-dlc-specification.md`; no new phases/terms introduced |
| **Codex description budget (8k chars total)** | Verb skills are invisible to the model; ~6 visible descriptions × ≤600 chars ≈ 3.6k — half the budget |
| **Copilot silent-fail on `name` prefixes** | Names are bare (`bolt-start`); namespacing comes from plugin machinery only; CI validates spec name rules incl. dir-name match |

## Open Decisions (need user)

1. Naming: `specsmd-aidlc` vs `aidlc` as plugin name (marketplace namespace is `@specsmd` either way).
2. Does `simple` flow survive the port, or is it folded into docs as "just use skills directly"?
3. Keep the 26 verb skills user-invocable in v1, or start with phase skills only and add verbs on demand?
4. rulesync dependency for long-tail tools vs. dropping non-skill tools entirely.
5. Where the plugin source lives: this monorepo (`plugins/` dir) vs. a new `fabriqaai/specsmd-plugins` repo.

## Next Steps

See the full porting plan: `memory-bank/ideas/skills-port-plan.md`.
