# Handoff — Skills & Plugins Port (`specsmd-skills` branch)

**Date**: 2026-08-07 · **Tests**: 436/436 passing (`cd src && npm run test`) · **Commits**: 4, local only (not pushed)

## What this branch does

Ports specsmd from the agent/slash-command architecture to **Agent Skills plugins**: five plugins under `plugins/`, 46 `SKILL.md` skills, installable via plugin marketplaces or the new `specsmd skills` CLI command. The methodology (AI-DLC phases, checkpoints, `memory-bank/` artifacts) is unchanged — only the delivery mechanism moved. Everything is additive: the classic `npx specsmd install` path, the VS Code extension, and the dashboard are untouched and keep working.

## The commits

| Commit | Contents |
|---|---|
| `100944f` docs | Port plan, AI-DLC×FIRE unification study, ideation session artifacts |
| `092132d` feat | The five plugins (core, aidlc, fire, ideation, simple) + marketplace + hooks |
| `561c8c1` test | Plugin format validation suite (`src/__tests__/plugins-validation.test.ts`) |
| `260324d` feat | `specsmd skills` bootstrapper CLI, Codex `openai.yaml` overlays, Agent Plugins spec conformance, docs page |

## Architecture in one minute

- **Phase skills are model-invocable** (8 total: `inception`, `construction`, `operations`, `fire`, `ideation`, `simple-spec`, `specsmd-status`, `using-specsmd`) — the only descriptions in any tool's trigger budget.
- **Verb skills (38) are user-invoked**: `disable-model-invocation: true` + `agents/openai.yaml` for Codex — zero model-context cost, invoked by name.
- **Master agent is dissolved**: descriptions route; `specsmd-status` (core) is the explicit navigator.
- **Bootstrap**: `specsmd-core`'s SessionStart hook injects `using-specsmd` verbatim (with a `<SUBAGENT-STOP>` guard) on startup/clear/compact.
- **Chains survive**: inception's auto-continue chain uses "REQUIRED NEXT SKILL" handoffs + a ledger in `inception-log.md`; bolt state stays in `bolt.md` frontmatter; bolt types are still runtime-read data (`bolt-start/references/bolt-types/`).
- **Formats**: skills follow the Agent Skills spec (six-field frontmatter + `metadata`); root `plugin.json` conforms to the Agent Plugins spec v1.0.0; per-tool manifests in `.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/`. Versions sync via `plugins/scripts/bump-version.cjs`.

## Install channels

```bash
# Claude Code
/plugin marketplace add fabriqaai/specs.md && /plugin install specsmd-aidlc@specsmd
# Codex
codex plugin marketplace add fabriqaai/specs.md
# Everything reading .agents/skills/ (Cursor, Copilot, Gemini, Zed, ...)
npx specsmd skills aidlc     # copies skills, symlinks .claude/skills, writes AGENTS.md fragment
```

## Decisions taken (all reversible, documented in `memory-bank/ideas/skills-port-plan.md` §5)

- Personas retired (user decision) · plugin-per-flow + `specsmd-core` · `specsmd-` prefixed names · all verbs in v1 · `simple` ported (not retired) · plugins live in this monorepo · old installer untouched · plugins versioned independently from npm package (all at 1.0.0).

## Defects fixed en route (11)

`bolt-complete.cjs` argv bug · bolt-replan hardcoded bolt type · 19 broken command paths · phantom operations skills (`menu`/`rollback`) · FIRE walkthrough dir-vs-file bug · FIRE `npm install` into user projects · missing standards guides handling · aidlc-init not creating the memory-bank tree · broken nested code fences · stale template paths · competitor-tool names in simple flow. Full list: `memory-bank/ideas/skills-port-implementation-notes.md`.

## Open items (need an owner/decision)

1. **AI-DLC × FIRE unification** — study at `memory-bank/research/aidlc-fire-unification-study.md` recommends Option B (shared runtime core + thin methodology profiles). User decision pending; plugin boundaries are already Option-B-compatible.
2. **Push + PR** — branch is local; nothing published.
3. **Dogfooding switch** — this repo still uses `.claude/commands/` + `.specsmd/` symlinks rather than its own plugins.
4. **Strict-spec overlay** — `disable-model-invocation` is outside the Agent Skills six-field core; a publish-time strip would make verb skills load in strictly-conformant Agent Plugins clients (today's real tools accept the field).
5. **Marketplace publication** — claude-plugins-official / skills.sh / `gh skill publish` submissions.
6. **VS Code extension awareness** of plugin paths (works today because `memory-bank/` is unchanged).
7. **Trigger evals in CI** (canonical prompt → expected skill) — sketched in plan §M4, not built.
8. Smaller: dedupe duplicated `references/` copies (memory-bank.yaml ×~7), drop legacy `stories-template.md`, Windows `.cmd` support for the SessionStart hook.

## Review pointers

- Start: `memory-bank/ideas/skills-port-implementation-notes.md`, then `plugins/README.md`, then `plugins/specsmd-core/skills/using-specsmd/SKILL.md` and the three aidlc phase skills.
- Validate: `cd src && npm run test` (33 files / 436 tests; plugin rules in `plugins-validation.test.ts`, CLI in `skills-installer.test.ts`).
- Planning artifacts: `memory-bank/ideas/skills-port-plan.md` (plan + decisions), `.specs-ideation/sessions/skills-port-20260806/` (ideation session that shaped it).
