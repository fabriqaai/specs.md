# Flame Report — Skills Port

**Session**: skills-port-20260806
**Method**: Six Hats (rapid) on contested decisions + Impact/Feasibility scoring on all 15 ideas
**Red Hat source**: AI fallback — inferred from user's framing (a skills-based system installable via plugins): strong preference for skills-native patterns, plugin-marketplace installation, cross-tool reach.

---

## Part 1 — Six Hats on the four contested decisions

### D1. Skill granularity: verbs as skills (S1-3) vs. phase mega-skills (S1-2)

| Hat | Analysis |
|-----|----------|
| White | 26 verb skills exist (6,333 lines); 4 phase agents are mostly routing tables + persona + checkpoint rules. Codex budget: 2% context / 8,000 chars for ALL descriptions. Claude/Codex/Cursor/Copilot all support user-only invocation (`disable-model-invocation` / `allow_implicit_invocation: false`). |
| Yellow | Verb granularity gives users direct access in every tool (`$bolt-status` in Codex, `/specsmd-aidlc:bolt-status` in Claude Code) and makes each skill small — ideal for progressive disclosure. |
| Black | 26 model-visible descriptions blow the Codex budget and pollute triggering (model may jump to `bolt-start` when the user says "build X", skipping inception). Phase-only skills lose direct verb access. |
| Green | **Hybrid resolves it**: phase skills + status + bootstrap are model-invocable (~6 descriptions in budget); verb skills ship `disable-model-invocation: true` — user-invocable slash commands that cost zero model context. Phase skills reference verbs by path, preserving the chain. |
| Blue | Port verbs mechanically (codemod), author ~6 model-facing descriptions by hand with care. |

**Verdict**: Hybrid — model-facing phase skills, user-facing verb skills. High confidence.

### D2. Packaging: plugin-per-flow (S2-2) vs. one monolithic plugin

| Hat | Analysis |
|-----|----------|
| White | 4 flows exist with different maturity (FIRE/ideation already skill-shaped; aidlc/simple gen-1). Claude marketplaces support multiple plugins per repo + symlink-dereferenced composites. Namespaces (`specsmd-aidlc:bolt-start`) prevent collisions. |
| Yellow | Per-flow plugins = per-flow versioning, smaller installs, users adopt one methodology without carrying four; matches the docs' own "flows are pluggable methodologies" framing. |
| Black | Four plugins × four manifests = manifest sprawl; shared assets (output standards, shared protocols) need a home; more release coordination. |
| Green | A `specsmd-core` plugin for shared bootstrap/status/standards skills; flow plugins depend on it (plugin `dependencies` field). A single-source version-bump script handles version sync. |
| Blue | Marketplace repo with `metadata.pluginRoot: "./plugins"`; each flow a directory; CI validates all manifests. |

**Verdict**: Plugin-per-flow + thin `specsmd-core`. Medium-high confidence.

### D3. The npm installer: bootstrapper (S2-3) vs. keep as-is vs. delete

| Hat | Analysis |
|-----|----------|
| White | Installer + 11 adapters have zero test coverage; commands they copy contain 19 broken paths; Codex/Cursor/Copilot are deprecating the very formats the adapters emit. But: `npx specsmd install` is the current onboarding funnel, the dashboard lives in the same package, and not every tool has a marketplace. |
| Yellow | Bootstrapper keeps one-command onboarding (`npx specsmd@latest install`) while native marketplaces become the primary channel; deletes ~11 adapters of untested code. |
| Black | Killing it outright orphans users on tools without marketplaces (Windsurf, Cline, Kiro, Roo) and breaks the dashboard distribution. Keeping it as-is means maintaining a parallel, deprecated distribution path forever. |
| Green | Bootstrapper writes `.agents/skills/` (universal), adds `.claude/skills` symlink, optionally invokes `rulesync` for long-tail tools. Marketplace install and npm install produce identical trees. |
| Blue | Rewrite `installer.js` around a single skills emitter; keep `dashboard`; deprecation notice on old flags. |

**Verdict**: Bootstrapper. High confidence.

### D4. Migration scope: big-bang all flows vs. AI-DLC-first incremental

| Hat | Analysis |
|-----|----------|
| White | FIRE and ideation are already SKILL.md-shaped (frontmatter, nested skills, references/) — they need relocation + manifest, not rewriting. AI-DLC is the flagship (CLAUDE.md centers on it) and the most gen-1. 166 hardcoded `.specsmd/...` paths across flows. VS Code extension activation depends on `.specsmd/` existing. |
| Yellow | AI-DLC-first proves the hard parts (persona → skill, auto-continue chain, checkpoints) on the flow that matters most; FIRE/ideation follow as mostly-mechanical moves. |
| Black | A long dual-generation period confuses users (two install stories). Big-bang risks a broken flagship while also churning three other flows. |
| Green | Ship `specsmd-ideation` FIRST as the pathfinder (smallest, already skill-shaped, 1 agent) to validate plugin structure end-to-end in days, then AI-DLC as the real port, then FIRE/simple. |
| Blue | Three milestones: pathfinder → flagship → long tail; old installer path stays functional until parity. |

**Verdict**: Incremental, ideation as pathfinder, AI-DLC as the main effort. High confidence.

---

## Part 2 — Impact / Feasibility scores (all 15)

| ID | Idea | Impact | Feasibility | I×F | Notes |
|----|------|--------|-------------|-----|-------|
| S1-1 | Description is the router | 5 | 4 | 20 | Dissolves the hardest porting problem; needs description craft |
| S1-2 | Phases as forked personas | 5 | 4 | 20 | Core mapping; overlay mechanics well documented |
| S1-3 | Skill-per-verb | 4 | 4 | 16 | Adopted as hybrid (D1) — verbs user-invocable only |
| S1-4 | Handoff chain + ledger | 5 | 4 | 20 | Solves auto-continue, the #2 hard problem; proven pattern |
| S1-5 | Context preflight sections | 4 | 5 | 20 | Simple convention; replaces unportable YAML |
| S2-1 | One tree, thin manifests | 4 | 5 | 20 | Well-established layout; manifests stay ~5 lines each |
| S2-2 | Plugin-per-flow marketplace | 4 | 4 | 16 | Needs specsmd-core split (D2) |
| S2-3 | Installer → bootstrapper | 4 | 4 | 16 | Deletes untested surface; keeps onboarding + dashboard |
| S2-4 | .agents/skills canonical | 5 | 5 | 25 | Highest-leverage single decision; near-zero cost |
| S2-5 | AGENTS.md constitution | 4 | 5 | 20 | Clean always-on/on-demand split |
| S3-1 | Codemod + authored descriptions | 4 | 4 | 16 | Bulk of the labor; risk is description quality |
| S3-2 | Fix-forward migration | 3 | 5 | 15 | Cheap insurance; already-catalogued defects |
| S3-3 | Bootstrap meta-skill + hook | 5 | 4 | 20 | Session-start injection is what makes skills reliably engage |
| S3-4 | Description budget engineering | 4 | 5 | 20 | Cheap, prevents silent cross-tool failure |
| S3-5 | Trigger evals | 4 | 3 | 12 | Highest ongoing cost; start minimal (CI prompt checks) |

**2×2 view — high-impact/high-feasibility quadrant**: S2-4, then the 20-point block (S1-1, S1-2, S1-4, S1-5, S2-1, S2-5, S3-3, S3-4).

---

## Part 3 — Red Hat (inferred) + Shortlist

Red Hat inference: the user's stated goal is a skills-based system installed via plugins. Ideas that lean into skills-native patterns (S1-4, S2-1, S3-3) and marketplace distribution (S2-2, S2-4) align with stated intent. Nothing in the bank contradicts AI-DLC immutable principles — the port changes the *delivery mechanism*, not the methodology.

**Shortlist for Forge** (as one composite concept, since the ideas are complementary rather than competing):

1. **S2-4** `.agents/skills/` canonical layout — the foundation
2. **S1-1 + S1-2 + D1 hybrid** — phase skills model-invocable, verb skills user-invocable
3. **S1-4 + S1-5** — handoff chain, ledger, context preflight
4. **S2-1 + S2-2 + S2-3** — plugin-per-flow marketplace + npm bootstrapper
5. **S3-3 + S3-4 + S2-5** — bootstrap meta-skill, description budgets, AGENTS.md constitution

Supporting (fold into execution): S3-1 codemod, S3-2 fix-forward, S3-5 minimal trigger evals.

→ Proceeding to Forge with the composite concept: **"specsmd as a skills-native plugin suite."**
