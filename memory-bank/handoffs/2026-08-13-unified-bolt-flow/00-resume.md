# Resume — Unified Bolt Flow, 2026-08-13

Use this document on a new machine. Do not rely on local scratch, Grok session files, or worktrees from the previous laptop — they will not be there.

## You are here

specsmd v2 (Unified Bolt Flow) was **specced on `main-v2`** and then **implemented as a 9-PR execute-plan stack**. The stack is **pushed to origin**. **No GitHub pull requests were created.** **`main-v2` itself does not contain the implementation** (except this handoff packet).

The last human message before this packet: the evals implementation looks terrible; summarize the evals decisions. That review is in `02-evals-decisions.md`. **Do not open PRs or merge the stack until that review is settled.**

## On the new machine

```bash
git clone https://github.com/fabriqaai/specs.md.git
cd specs.md
git checkout main-v2
git pull origin main-v2
# this packet:
open HANDOFF.md   # or just read it

# the actual implementation (tip of the stack):
git fetch origin
git checkout execute-plan/2040fa95-pr-9-v2-documentation
```

Tests (from the tip, not from `main-v2`):

```bash
cd src && npm ci && npm run test
```

Last recorded result on the assembled tip: **605 passed**. That run was not repeated after this handoff was written.

## What the user asked for, in order

1. Get ready to **dogfood** specs.md on other projects. Check docs. Find the “committee story.”
2. “Go use subagents make it happen.”
3. “Fix” (reviewer bugs on a thin dogfood `plugins/specsmd/` slice).
4. **“Forget dogfood for now execute the plan.”** — drop the thin slice as the goal; run the full 9-PR DAG via `/execute-plan`.
5. “Did you create PR on github? Did you actually push?” — **pushed, no PRs.**
6. “Your evals implementation look terrible… summarize what decision you made on evals.”
7. **This:** write a handoff, commit, push, so work continues on another machine.

There is no file named “committee story.” The committed product story is the 2026-08-09 Unified Bolt Flow.

## Product story (one paragraph)

One skills-native flow: **FIRE mechanics, AI-DLC vocabulary**. Hierarchy is Intent → Work Item. Execution container is a **bolt**, created when you are ready, grouping one or more work items. Recipes (`default` / `ddd` / `spike` / `simple`) are data. Skills **recommend, never enforce sequence**. State lives in artifact YAML frontmatter under `docs/specsmd/` — **no `state.yaml`**. Specs are **nlspecs** (observable behavior, not mechanism). Delivery is the self-contained **`specsmd` plugin**, marketplace-only. **No v2 npm CLI. No migration tooling, ever.** v1 stays on `main` with full maintenance and no new features.

Concept: `.specs-ideation/sessions/aidlc-fire-unification-20260809/concept-briefs/unified-bolt-flow.md`  
Study: `memory-bank/research/aidlc-fire-unification-study.md`  
Intent: `docs/specsmd/intents/001-unified-bolt-flow/` (on `main-v2` for specs; implementation + some decision docs only on the stack)

## What exists where

| Place | What you will find |
|---|---|
| `origin/main` | Frozen v1. **No plugins in the default-branch marketplace.** Do not add v2 features here. |
| `origin/main-v2` @ `17c9238` **plus this handoff commit** | Specs, nlspec standard, work items 000–012, locked evals *spec*, this packet. **No `plugins/specsmd/` implementation.** |
| `origin/execute-plan/2040fa95-pr-1` … `pr-9` | The implementation stack. Linear: each branch is an ancestor of the next. Parent of PR1 is `main-v2` @ `17c9238`. |
| `wip/unified-foundation` | **Local-only** on the old machine (`0966b23`). **Not on origin.** Already absorbed into PR2 as commit `3109239`. Do not depend on it. |
| GitHub PRs | **None.** |
| Default marketplace add (`/plugin marketplace add fabriqaai/specs.md`) | Still fails to install v2 — default branch is `main`. Install from a **local path** or `--ref main-v2` **after** the stack is merged. Today even `main-v2` has no plugin until the stack is merged. |

## Execute-plan facts

- Skill: `/execute-plan` against design doc `docs/specsmd/decisions/002-unified-flow-pr-plan.md` (**that file exists only on the stack**, starting PR2 / fully on the tip).
- PLAN_ID: `2040fa95`
- Mode: **plain-git** (Graphite not installed). `gh` is available. **`--auto-pr` was not set**, so branches were pushed and compare URLs printed.
- Stack parent: **`main-v2`**, not `main` (user instruction; v1 is frozen).
- Effort 1, concurrency 4.
- All 9 PRs implemented + reviewed to **zero open issues** (42 issues found and fixed: 14 bugs, 22 suggestions, 6 nits; 16 review rounds).
- Workspace on the old machine was restored to **clean `main-v2`**. Worktrees were removed.

## What shipped on the tip (substance)

Self-contained plugin `plugins/specsmd/` with skills:

`using-specsmd`, `specsmd-status`, `specsmd-init`, `intent-create`, `work-item-decompose`, `bolt-plan`, `bolt-start`, `bolt-execute`, `walkthrough-generate`, `release-checklist`, `release-verify`, `flow-runtime` (scripts + contract + four recipes).

Also: `evals/` harness (see `02-evals-decisions.md`), integrity validator, standards/constitution, memory lifecycle, slim release, marketplace manifests (`.claude-plugin/`, `plugins/.claude-plugin/`, `.agents/plugins/`), `/v2` Mintlify docs with version switcher.

Tip vs `17c9238`: **138 files, +15,625 / −122**. Tip SHA: `693c8eb`.

## What is *not* done

- No GitHub PRs, no merge to `main-v2`, no default-branch marketplace.
- Sufficiency checks for work items 001–012 before implementation: **not done** (that DoD item is advisory). Some frontmatter says `dogfood-cleared`.
- 000 was recorded `sufficiency: cleared` **without a second triangulation probe**.
- Holdout **scenarios** do not exist (empty folder + README).
- Trigger evals are **lexical overlap**, not model routing.
- Conformance has machine checks **only for 000**; 001–012 are `needs-human`.
- This repo does **not** dogfood the unified flow under `docs/specsmd/` yet. User said forget dogfood for now.
- Website `/v2` is on the stack only; production site still deploys from whatever `main-v2` is today (pre-stack, plus this handoff).

## Next decisions (human)

Pick one, in this order of caution:

1. **Review / redo evals (PR1)** — user already said it looks terrible. If you rewrite evals, you must **not** also touch `plugins/specsmd/` in the same commit (holdout rule). A rewrite of PR1 **invalidates the rest of the stack** if it changes contracts the later PRs assumed. Prefer: new commits on PR1, then restack 2–9, or a follow-up evals-only branch off the tip.
2. **Open the 9 draft PRs** — commands in `01-stack.md`. Only after you accept PR1.
3. **Merge the stack into `main-v2`** without GitHub PRs (fast-forward or merge the tip).
4. Leave the stack on origin and continue implementation review of PRs 2–9.

Do **not** invent more implementation until one of those is chosen. Do **not** merge to `main`.

## Paste this into the next agent session

```text
Resume specsmd Unified Bolt Flow from the handoff packet.

Read, in order:
- HANDOFF.md
- memory-bank/handoffs/2026-08-13-unified-bolt-flow/00-resume.md
- memory-bank/handoffs/2026-08-13-unified-bolt-flow/01-stack.md
- memory-bank/handoffs/2026-08-13-unified-bolt-flow/02-evals-decisions.md
- memory-bank/handoffs/2026-08-13-unified-bolt-flow/03-constraints.md

Facts: PLAN_ID 2040fa95, nine branches pushed, zero GitHub PRs,
main-v2 does not contain the plugin, user called the evals implementation terrible.
Do not open PRs or merge until I say so. Stack parent is main-v2. v1 main is frozen.
```

## Constraints the next agent must keep

See `03-constraints.md`. Short form: no sequence enforcement in skills; no `state.yaml`; recipes are data; scripts only write state; nlspecs have no file names or mechanism; no competitor names in new docs; no v2 npm CLI; marketplace-only; no migration tooling ever; no mixed `evals/` + `plugins/specsmd/` commit.

## Session artifacts that will *not* transfer

- `/var/folders/.../T/grok-501/grok-exec-plan-2040fa95.json` (old-machine TMPDIR)
- Grok session compaction segments under `~/.grok/sessions/`
- Local worktrees under `~/.grok/worktrees/`
- Local-only branch `wip/unified-foundation`

Everything needed to continue is on `origin`.
