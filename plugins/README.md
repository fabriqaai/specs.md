# specsmd Plugins

specsmd's spec-driven development flows, delivered as [Agent Skills](https://agentskills.io) plugins. One skills tree per flow, thin per-tool manifests, installable from this repo's marketplace.

Each plugin's root `plugin.json` conforms to the vendor-neutral [Agent Plugins spec](https://github.com/agentplugins/agent-plugins-spec) v1.0.0 (`$schema` declared, closed manifest, fixed `skills/` discovery). Known deviation: verb skills carry the `disable-model-invocation` frontmatter field — a Claude Code / Cursor / Copilot extension outside the Agent Skills six-field core — so a strictly conformant client may skip those skills; a publish-time overlay that strips the field for strict channels is a planned follow-up. Codex gets the equivalent policy via each verb skill's `agents/openai.yaml` (`allow_implicit_invocation: false`).

| Plugin | What it gives you |
|---|---|
| `specsmd-core` | Session bootstrap (`using-specsmd`), project navigator (`specsmd-status`), always-on principles fragment. Install this with any flow. |
| `specsmd-aidlc` | AI-DLC methodology: `inception` → `construction` → `operations` phase skills + all verb skills (`intent-create`, `bolt-plan`, `bolt-start`, `deploy`, …) |
| `specsmd-fire` | FIRE flow: `fire` entry skill + planner/builder verb skills with autonomy modes (autopilot / confirm / validate) |
| `specsmd-ideation` | Ideation flow: `ideation` entry skill + `spark` / `flame` / `forge` |
| `specsmd-simple` | Lightweight flow: `simple-spec` entry skill + `spec-requirements` / `spec-design` / `spec-tasks` / `spec-execute` |

## Install

### Claude Code

```bash
/plugin marketplace add fabriqaai/specs.md
/plugin install specsmd-core@specsmd
/plugin install specsmd-aidlc@specsmd     # or -fire / -ideation / -simple
```

### Codex CLI

```bash
codex plugin marketplace add fabriqaai/specs.md
```

Or link the skills directly (Codex reads `.agents/skills/`):

```bash
mkdir -p ~/.agents/skills
ln -s /path/to/specs.md/plugins/specsmd-aidlc/skills/* ~/.agents/skills/
```

### Cursor / Copilot / Gemini / Zed / others

Every tool that reads the neutral `.agents/skills/` location works with a copy or symlink of a plugin's `skills/` directory into `<project>/.agents/skills/`. Cursor and Copilot also read `.claude/skills/` directly.

## Design rules (for contributors)

- One directory per skill: `skills/<name>/SKILL.md`; `name` frontmatter must equal the directory name.
- Frontmatter: the six spec fields (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`) plus `disable-model-invocation` for user-invoked verb skills. Nothing else.
- Descriptions are triggers, not summaries: say when to use the skill; never enumerate its workflow steps. Verb skills ≤300 chars; phase skills ≤600.
- Phase skills are the only model-invocable skills. Verb skills carry `disable-model-invocation: true` so they cost no model context and are invoked by name.
- Supporting material ships inside the skill: `references/` (templates, schemas, bolt types), `scripts/` (Node .cjs helpers), `assets/`.
- Skills reference each other by name ("invoke the `bolt-plan` skill"), never by path.
- User-project artifact paths (`memory-bank/`, `.specs-fire/`, `.specs-ideation/`, `specs/`) are part of the flow contract and stay as-is.
- Versioning: single source, propagated by `scripts/bump-version.cjs <version> [plugin]`. Skill bodies carry `metadata.version`.

Validation: `cd src && npx vitest run __tests__/plugins-validation.test.ts`

## Relationship to `npx specsmd install`

The npm installer keeps working unchanged and remains the path for tools without plugin/skill support. These plugins are the native-skills channel; both produce workflows over the same project artifacts, and projects started with either continue to work with the other.
