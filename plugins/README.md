# specsmd Plugins

specsmd's spec-driven development flows, delivered as [Agent Skills](https://agentskills.io) plugins. One skills tree per flow, thin per-tool manifests, installable from this repo's marketplace.

Each plugin's root `plugin.json` conforms to the vendor-neutral [Agent Plugins spec](https://github.com/agentplugins/agent-plugins-spec) v1.0.0 (`$schema` declared, closed manifest, fixed `skills/` discovery). Known deviation: verb skills carry the `disable-model-invocation` frontmatter field — a Claude Code / Cursor / Copilot extension outside the Agent Skills six-field core — so a strictly conformant client may skip those skills; a publish-time overlay that strips the field for strict channels is a planned follow-up. Codex gets the equivalent policy via each verb skill's `agents/openai.yaml` (`allow_implicit_invocation: false`).

| Plugin | What it gives you |
|---|---|
| `specsmd` | **Default install.** Unified bolt flow (AI-DLC v2): intents, work items, dynamic bolts, recipes, ceremony dial. Artifacts in `docs/specsmd/`. Self-contained — one install is the complete flow. |
| `specsmd-core` | Session bootstrap (`using-specsmd`), project navigator (`specsmd-status`), always-on principles fragment. Install this with any legacy flow. |
| `specsmd-aidlc` | AI-DLC methodology: `inception` → `construction` → `operations` phase skills + all verb skills (`intent-create`, `bolt-plan`, `bolt-start`, `deploy`, …) |
| `specsmd-fire` | FIRE flow: `fire` entry skill + planner/builder verb skills with autonomy modes (autopilot / confirm / validate) |
| `specsmd-ideation` | Ideation flow: `ideation` entry skill + `spark` / `flame` / `forge` |
| `specsmd-simple` | Lightweight flow: `simple-spec` entry skill + `spec-requirements` / `spec-design` / `spec-tasks` / `spec-execute` |

## Install

The unified flow is marketplace-only. There is no v2 npm CLI. One marketplace install of `specsmd` is the complete flow (bootstrap + navigator included).

### Claude Code

```bash
/plugin marketplace add /absolute/path/to/specs.md
/plugin install specsmd@specsmd           # unified bolt flow (default)

# Legacy v1 flows (still published):
/plugin install specsmd-core@specsmd
/plugin install specsmd-aidlc@specsmd     # or -fire / -ideation / -simple
```

### Codex CLI

Codex reads `.agents/plugins/marketplace.json` (`source.path: "./plugins/<name>"`). `origin/HEAD` is still `main` (v1 only), so add a checkout of this branch or pin `--ref main-v2` until that branch is the default.

```bash
# This checkout (has the unified plugin today)
codex plugin marketplace add /absolute/path/to/specs.md
codex plugin install specsmd

# Git — pin the v2 branch until it is the default
codex plugin marketplace add fabriqaai/specs.md --ref main-v2
codex plugin install specsmd
```

### Manual install (no marketplace)

Tools without a plugin marketplace get the same skills by copying them into the consuming project's `.agents/skills/`. The source is this specs.md checkout, not the consumer tree.

From this repository's root (dogfood):

```bash
mkdir -p .agents/skills
cp -R plugins/specsmd/skills/* .agents/skills/
```

From a consumer project:

```bash
mkdir -p .agents/skills
cp -R /path/to/specs.md/plugins/specsmd/skills/* .agents/skills/
```

Each skill is then invocable by name (`using-specsmd`, `specsmd-status`, `intent-create`, …). Optionally append `plugins/specsmd/agents-md/AGENTS-fragment.md` from this checkout to the project's `AGENTS.md`. Cursor and Copilot also read `.claude/skills/`; a symlink is enough:

```bash
mkdir -p .claude
ln -s ../.agents/skills .claude/skills
```

Legacy v1 plugins use the same copy pattern from `plugins/specsmd-<flow>/skills/` **and** `plugins/specsmd-core/skills/`.

## Design rules (for contributors)

- One directory per skill: `skills/<name>/SKILL.md`; `name` frontmatter must equal the directory name.
- Frontmatter: the six spec fields (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`) plus `disable-model-invocation` for user-invoked verb skills. Nothing else.
- Descriptions are triggers, not summaries: say when to use the skill; never enumerate its workflow steps. Verb skills ≤350 chars; bootstrap/navigator ≤600.
- In the unified plugin, only `using-specsmd` and `specsmd-status` are model-invocable. Every other skill carries `disable-model-invocation: true` so it costs no model context and is invoked by name. Legacy plugins keep phase skills model-invocable.
- Supporting material ships inside the skill: `references/` (templates, schemas, bolt types), `scripts/` (Node .cjs helpers), `assets/`.
- Skills reference each other by name ("invoke the `bolt-plan` skill"), never by path.
- User-project artifact paths (`memory-bank/`, `.specs-fire/`, `.specs-ideation/`, `specs/`) are part of the flow contract and stay as-is.
- Versioning: single source, propagated by `scripts/bump-version.cjs <version> [plugin]`. Skill bodies carry `metadata.version`.

Validation: `cd src && npx vitest run __tests__/plugins-validation.test.ts`

## Relationship to `npx specsmd install`

The npm installer is the v1 channel. It is unchanged and does not install the unified flow. Marketplace-less tools use the manual copy path above for `specsmd`; v1 flows may still use `npx specsmd install` or `npx specsmd skills`.
