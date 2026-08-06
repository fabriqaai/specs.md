# Skills Port — Implementation Notes (overnight run, 2026-08-07)

**Branch**: `specsmd-skills` · **Plan**: `skills-port-plan.md` · **Status**: M0–M2 complete + FIRE/ideation/simple ported (parts of M3); all 429 tests green.

## What was built

```
plugins/
├── .claude-plugin/marketplace.json        # marketplace "specsmd", 5 plugins
├── scripts/bump-version.cjs               # single-source version sync
├── README.md                              # install per tool + contributor rules
├── specsmd-core/        2 skills  + SessionStart hook + AGENTS fragment
├── specsmd-aidlc/      24 skills  (3 phase + 21 verb)
├── specsmd-fire/       11 skills  (1 phase + 10 verb)
├── specsmd-ideation/    4 skills  (1 phase + 3 verb)
└── specsmd-simple/      5 skills  (1 phase + 4 verb)
```

46 skills total. Each plugin has 4 manifests (.claude-plugin/, .codex-plugin/, .cursor-plugin/, root plugin.json for Copilot/VS Code), all at v1.0.0.

**Model-invocable skills (8)** — the only descriptions in any tool's trigger budget: `using-specsmd`, `specsmd-status`, `inception`, `construction`, `operations`, `fire`, `ideation`, `simple-spec`. Combined description size is well under the strictest tool budget (validated by test).

**Verb skills (38)** — all carry `disable-model-invocation: true`: invoked by name, zero model-context cost.

Key mechanisms:
- **Bootstrap**: `specsmd-core` SessionStart hook injects `using-specsmd` verbatim (with `<SUBAGENT-STOP>` guard) on startup/clear/compact. Fails silent — never breaks session start.
- **Routing**: Master agent dissolved. Descriptions route; `specsmd-status` is the explicit navigator (reads memory-bank/, .specs-fire/, .specs-ideation/, specs/; recommends next skill; read-only).
- **Auto-continue chain**: preserved via "REQUIRED NEXT SKILL" handoffs + a chain ledger appended to `inception-log.md` for compaction/resume safety. Checkpoints 1–4 intact and hard.
- **Bolt types**: still workflow-as-data — `bolt-start` reads `references/bolt-types/<type>.md` at runtime.
- **Context Preflight** sections replace `context-config.yaml` (with warn/stop on-missing behavior carried over).
- Personas retired throughout (user decision); phase skills carry role framing + hard-constraint blocks.

## Defects fixed during the port (not carried forward)

1. `bolt-complete.cjs`: `process.argv['--last-stage']` (string-indexing an array — flag was permanently undefined) → real argv parsing, both `--flag value` and `--flag=value`.
2. `bolt-replan` hardcoded `ddd-construction-bolt` for appended bolts → resolves type like `bolt-plan` (unit-brief `default_bolt_type`, then unit-type fallback; split bolts inherit).
3. All 19 broken `.specsmd/skills/...` path references → skill-name references.
4. Phantom `operations/menu.md` + `rollback.md` → real navigator content in the `operations` phase skill; rollback documented inside `deploy` (with explicit "no separate rollback skill" note).
5. FIRE `walkthrough-generate` read work items as directories → files `{id}.md`.
6. FIRE `run-execute` ran `npm install yaml` in the user's project → installs into the skill's own scripts dir only. Same pattern documented for the aidlc scripts (`fs-extra`/`js-yaml` via `npm install --prefix <skill>/scripts`).
7. `catalog.yaml` referenced 3 nonexistent guide files → aidlc-init facilitates from the catalog when a guide is missing.
8. `aidlc-init` never created the memory-bank tree/decision-index despite the schema saying so → steps added.
9. Broken nested code fences in prototype-apply/deploy/build → widened outer fences.
10. Competitor-tool names in simple flow's source (question-tool references) → generic phrasing.
11. Stale template paths inside copied reference templates → rewritten to bundled locations.

## Validation

- New suite `src/__tests__/plugins-validation.test.ts` (13 tests): SKILL.md per dir, name==dirname + spec name rules, sanctioned frontmatter keys only, metadata.version/flow, description budgets (verb ≤350, phase ≤600, spec ≤1024, model-visible total ≤8k), h1 body start, zero `.specsmd/`/`src/flows/` references, bundled-file existence (understands the cross-skill "in the `X` skill" idiom), manifest validity + version sync with marketplace.
- Full suite: **429/429 passing** (`cd src && npm run test`).
- All `.cjs` scripts pass `node --check`; SessionStart hook smoke-tested (emits correct hookSpecificOutput JSON).

## What was deliberately NOT done (follow-ups)

1. **npm installer rewrite** — untouched by design (backward-compat guarantee). Follow-up: add a skills-emitting bootstrapper mode.
2. **VS Code extension / dashboard changes** — memory-bank/ layout unchanged so they keep working; adding plugin-path awareness is M3 follow-up.
3. **AI-DLC × FIRE unification (Option B)** — awaiting user decision; plugin boundaries are Option-B-compatible.
4. **Codex `agents/openai.yaml` overlays** (per-skill implicit-invocation policy) — v1.1 candidate.
5. **Trigger evals in CI** (canonical prompt → expected skill) — harness sketched in plan §M4, not built.
6. **Docs site pages** for plugin install — drafted only in plugins/README.md.
7. **Dogfooding switch** — this repo still uses `.claude/commands/` + `.specsmd/` symlinks; switching to the plugins is a deliberate later step.
8. Duplicated reference copies (memory-bank.yaml ×~7 across skills, catalog.yaml ×3, protocols ×3) — sanctioned for v1; a shared-reference mechanism is a v2 concern.
9. `stories-template.md` in story-create marked "legacy reading only" — recommend dropping in v2.
10. Windows support for the SessionStart hook (currently requires `node` on PATH; no .cmd polyglot).

## Review pointers

- Start with `plugins/README.md`, then `specsmd-core/skills/using-specsmd/SKILL.md`, then the three aidlc phase skills.
- Conversion agents' detailed reports: session scratchpad (`report-fire.md` etc.); summaries in this file are authoritative for what changed.
- Everything is additive: no file outside `plugins/`, `src/__tests__/plugins-validation.test.ts`, `memory-bank/{ideas,research}/`, and `.specs-ideation/` was modified.
