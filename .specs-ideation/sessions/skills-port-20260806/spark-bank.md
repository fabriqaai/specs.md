# Spark Bank — Skills Port

**Session**: skills-port-20260806
**Topic**: Porting specsmd from agent-based to skill-based system (Agent Skills / SKILL.md standard), installable via plugins across Claude Code, Codex, Cursor, Copilot, Gemini and others
**Generated**: 2026-08-06
**Inputs**: Research reports on skills-based plugin ecosystems, specsmd current architecture, and cross-tool skills/plugin specs (see scratchpad research/ for this session)

Technical/architectural topic → diversity = distinct engineering perspectives, per Spark anti-bias mandate.

---

## Theme A — Architecture: mapping agents to skills

**S1-1 — The Description Is the Router**
Dissolve the Master Agent's `route-request`/`analyze-context` dispatch role. In a skills world, routing is native: each phase skill's `description` is the trigger predicate, and the harness's own skill-matching does what Master did. Master shrinks to a small `specsmd-status` navigator skill that reads `memory-bank/` state and recommends the next skill — advisory, not gatekeeping.
*(technique: Inversion — the orchestrator becomes the thing orchestrated)*

**S1-2 — Phases as Forked Personas**
Each phase (inception/construction/operations) becomes a skill authored to the portable six-field spec, with a Claude Code overlay adding `context: fork` + `agent: general-purpose` + `disable-model-invocation` where persona isolation matters. In tools without fork semantics the same skill runs inline — graceful degradation. Forbidden-actions lists move into the skill body as explicit hard-constraint blocks, since persona isolation can no longer enforce them structurally.
*(technique: Analogy — Copilot/Claude `context: fork` convergence)*

**S1-3 — Skill-per-Verb, Not Skill-per-Agent**
Instead of porting 4 mega agent-skills, expose the existing 26 verb skills directly as first-class skills (`intent-create`, `bolt-plan`, `bolt-start`, `deploy`…), each with `metadata.phase`. The phase "agents" become thin workflow skills that sequence the verbs via explicit handoffs. Users in any tool can invoke exactly the verb they need without going through an agent ceremony.
*(technique: First Principles — the verb is the unit of user intent, the agent was packaging)*

**S1-4 — Handoff Chain with a Ledger**
Re-encode the load-bearing inception auto-continue chain (context → units → stories → bolt-plan → review) as explicit handoffs: each skill body ends with "REQUIRED NEXT SKILL: X unless at checkpoint N". Add a compaction-surviving ledger file per intent so a resumed session knows exactly where the chain stopped. Bolt frontmatter already works this way — extend the pattern to inception.
*(technique: Analogy — execution ledgers in long-running agent workflows)*

**S1-5 — Context Preflight Instead of context-config.yaml**
`context-config.yaml` has no skills-model analogue. Replace it with a standard `## Context Preflight` section at the top of each SKILL.md body listing required artifacts, their purpose, and on-missing behavior (warn/stop). The Claude Code overlay can upgrade this to `!`command`` dynamic injection so the context arrives pre-loaded; other tools just follow the prose.
*(technique: SCAMPER/Substitute — declarative YAML → in-body convention)*

---

## Theme B — Packaging & distribution

**S2-1 — One Skills Tree, Thin Manifests**
A single `skills/` component tree per plugin with four tiny manifests pointing at it: `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `.cursor-plugin/plugin.json`, root `plugin.json` (Copilot/VS Code — which also auto-detects Claude's). All four default-scan `skills/`, so manifests stay ~5 lines. One version number propagated across all manifests by a single-source bump script.
*(technique: Analogy — multi-manifest layouts used by cross-tool plugins)*

**S2-2 — Plugin-per-Flow in One Marketplace**
Ship `specsmd-aidlc`, `specsmd-fire`, `specsmd-ideation`, `specsmd-simple` as separate plugins in one `fabriqaai/specsmd` marketplace repo (`.claude-plugin/marketplace.json`). Users install only the methodology they want: `/plugin marketplace add fabriqaai/specsmd` → `/plugin install specsmd-aidlc`. A composite `specsmd-full` plugin can link sibling plugins' skills via marketplace symlink dereferencing.
*(technique: First Principles — a flow is the natural unit of adoption)*

**S2-3 — The npm Installer Becomes a Bootstrapper**
`specsmd install` stops copying 11 tool-specific command formats. New job: create `.agents/skills/` symlinks/copies, register the marketplace where supported, write the AGENTS.md fragment, keep `dashboard`. The 11 hand-rolled adapters (zero test coverage today) retire; long-tail tools that still need rules/commands conversion delegate to `rulesync` instead of in-house code.
*(technique: SCAMPER/Eliminate — delete the code the ecosystem made redundant)*

**S2-4 — `.agents/skills/` as the Canonical Location**
Install skills once into `<project>/.agents/skills/` — read natively by Codex, Cursor, Copilot, Gemini, Zed, Goose, Amp, Crush, Factory, Kilo. Claude Code (the one holdout) gets a `.claude/skills → ../.agents/skills` symlink, which it follows and de-duplicates. Zed reads nothing else, so this single decision decides the layout.
*(technique: First Principles — smallest surface that reaches every tool)*

**S2-5 — AGENTS.md Carries the Constitution**
Skills are on-demand; the immutable AI-DLC principles (three phases only, mob rituals, "hours or days", noun-verb commands, AI-drives-human-validates) must constrain the model even when no skill has triggered. Move them into an installed `AGENTS.md` fragment at project root (CLAUDE.md symlinked to it; Gemini via `context.fileName` opt-in). Skills reference it instead of restating it.
*(technique: First Principles — always-on vs on-demand context split)*

---

## Theme C — Migration, DX, quality

**S3-1 — Codemod + Hand-Authored Descriptions**
A conversion script ports the 26 gen-1 AI-DLC skill files to `skills/<name>/SKILL.md` directories, preserving the Goal/Input/Process section contract in the body. Descriptions are NOT generated mechanically — each is authored to the trigger-not-summary rule (a documented failure mode: when a description summarizes the workflow, agents follow the description and skip the body). Schema tests updated to validate the six-field spec + directory-name-matches-name rule.
*(technique: SCAMPER/Adapt — reuse gen-2 (FIRE/ideation) conventions as the target format)*

**S3-2 — Fix-Forward Migration**
The port fixes rather than carries forward the known defects: 19 broken `.specsmd/skills/...` paths in commands, phantom `menu.md`/`rollback.md` operations skills, repo-relative path in construction command, drifted `.claude/commands/` copies, dead `dummyConfig` code. Add the missing path-integrity test (today zero tests cover installers or path references).
*(technique: Inversion — treat migration as the repair opportunity, not a translation risk)*

**S3-3 — Bootstrap Meta-Skill + SessionStart Hook**
A `using-specsmd` meta-skill (~500 words) injected verbatim by a SessionStart hook, with a `<SUBAGENT-STOP>` guard so dispatched subagents don't re-enter the methodology. It states the skill-use mandate, the phase precedence rules, and points to `specsmd-status` for orientation. Acceptance test: "build me a todo app" in a clean session must trigger inception, not raw code.
*(technique: First Principles — session-start injection is what makes on-demand skills reliably engage)*

**S3-4 — Description Budget Engineering**
Codex gives the entire startup skill list max 2% of context / 8,000 chars — for ~26 verb skills that's ~300 chars each before truncation. Write every description trigger-condition-first, ≤300–600 chars; put elaboration in `when_to_use` (Claude overlay only). Descriptions become a tested, budgeted artifact, not an afterthought.
*(technique: First Principles — the description is the entire runtime API of a skill)*

**S3-5 — Trigger Evals (drill-style)**
Adopt a "skill edits require evals" discipline: a small harness that runs canonical prompts ("start a new feature", "plan bolts", "deploy to staging") against clean sessions in Claude Code and Codex and verifies the right skill triggered. Wire into CI for description changes. The dominant failure mode of skills isn't bad content — it's non-triggering.
*(technique: Inversion — test that skills fire, not just what they say)*

---

## Domain coverage

| Perspective | Ideas |
|---|---|
| Architecture / agent→skill mapping | S1-1..S1-5 |
| Packaging & distribution | S2-1..S2-5 |
| Migration strategy | S3-1, S3-2 |
| Developer experience | S2-3, S3-3 |
| Quality & testing | S3-4, S3-5 |
| Prior art (skills-library patterns) | S1-4, S2-1, S3-3, S3-5 |
