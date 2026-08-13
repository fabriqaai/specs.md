# Evals decisions — read this before touching PR1

**Human reaction (2026-08-13):** the evals implementation looks terrible. This file separates **already-locked product decisions** from **mechanism PR1 invented**. Review those inventions before opening PRs or rewriting.

Branch: `execute-plan/2040fa95-pr-1-evals-and-verifiers` @ `6e332fc`  
Spec (also on `main-v2`): `docs/specsmd/intents/001-unified-bolt-flow/work-items/000-flow-evals.md`  
Product decision commit: `17c9238` (`docs: decide the evals spec — tiered sufficiency, evals/ holdout, divergence pass bar`)

## Locked (do not reopen unless the human says so)

From 000 and `17c9238`:

- Evals exist **before** the rest of the flow. Later work items are supposed to be judged against checks that already exist.
- Sufficiency is **tiered by `complexity`**:
  - **high** → triangulation: isolated implement-from-spec-only probe + separate judge; two probes; divergence at the point they disagree.
  - **medium / low** → adversarial review: no implement; hunt for divergence readings, contradictions, missing defaults, untestable criteria.
- Pass bar is **interchangeability**, not probe conformance. Open **divergence** or **contradiction** ⇒ not-cleared. Advisory findings may stay open. Full probe DoD pass is *not* the bar.
- Outcome is recorded **with the work item** so “cleared for implementation” is answerable from the artifact tree.
- Eval definitions and holdout scenarios live in top-level **`evals/`**. A change that touches **flow implementation and `evals/` together** is rejected before merge.
- Conformance labels each Definition of Done criterion honestly: machine-verified vs needs human/scenario. A criterion that cannot be evaluated is a **spec defect**, not a silent skip.
- Trigger evals: canonical prompts → expected **model-invocable** skill; report activation / mis-routing.
- Holdout scenarios judged on **satisfaction**, not `assert true`.
- Out of scope of 000: scheduled/CI *execution of the evals themselves*; legacy-flow evals; sufficiency of specs outside this intent.

Research behind this: `memory-bank/research/nlspec-harness-study.md`.

## What PR1 actually built

A CommonJS harness under `evals/` plus Vitest under `src/__tests__/evals/`. ~2.3k lines. Four runners + a GitHub Actions path linter.

| Path | Role |
|---|---|
| `evals/sufficiency/run.cjs` | Print protocol / record findings / write frontmatter |
| `evals/sufficiency/protocols/{triangulation,adversarial-review}.md` | Human/agent protocols |
| `evals/conformance/run.cjs` | Walk every DoD checkbox |
| `evals/triggers/run.cjs` + `fixtures/*.yaml` | Prompt → skill scorer |
| `evals/holdout/run.cjs` | Path-prefix isolation |
| `evals/holdout/scenarios/README.md` | Empty — no scenarios |
| `.github/workflows/evals-holdout.yml` | CI on PR/push to `main`, `main-v2`, `dev` |
| `src/__tests__/evals/*.test.ts` | Unit tests (not inside `evals/`) |

## Implementation decisions (these are the ones to attack)

### 1. Sufficiency is a recorder, not a runner of agents

The CLI does **not** spawn a probe implementer or a judge. You already wrote findings YAML; it derives `cleared` / `not-cleared` and writes:

- work-item frontmatter: `sufficiency`, `sufficiency_report`
- report file (path **the spec never named**): `docs/specsmd/intents/{intent}/sufficiency/{id}.md`

`--outcome cleared` is refused while a blocking finding is open. Scripts are the only writers of those fields.

### 2. 000 was stamped `cleared` without a second probe

The recorded report (`docs/specsmd/intents/001-unified-bolt-flow/sufficiency/000-flow-evals.md` on the stack) says:

> A second independent probe was not run; that residual process risk is advisory, not a spec divergence.

High-complexity protocol requires two probes. They waived it.

Work items 001–012 were **not** put through sufficiency before implementation (advisory DoD). Some later frontmatter says `dogfood-cleared`.

### 3. Three “named freedoms” written into that cleared report

| Freedom | Choice they made |
|---|---|
| Report location unspecified | `docs/specsmd/intents/{intent}/sufficiency/{id}.md` + `sufficiency_report` pointer |
| Trigger scoring unspecified | Lexical overlap; “a later judge model may replace the scorer” |
| “Flow implementation” path unspecified | `plugins/specsmd/` only — not `plugins/specsmd-*` |

### 4. Conformance is five regexes on 000; everything else is `needs-human`

Only 000’s gating lines have machine checks. 001–012 all `needs-human`. They added a fourth label the spec did not name: **`spec-defect`**. Exit 1 only if `failed` or `spec-defect`. A tree of almost-all `needs-human` is a **passing** run.

So “evals first so later items are implemented against existing checks” is **not true in the machine**. The later checks do not exist.

### 5. Trigger evals are bag-of-words

Fixtures only for `using-specsmd` and `specsmd-status` (the two model-invocable skills). Verb skills ignored (`disable-model-invocation: true`).

Scorer: tokenize, drop stopwords, crude stem (`ing` / trailing `s`), overlap / prompt-size, +0.25 if the skill **name** appears in the prompt. Highest score among invocable skills wins.

If `plugins/specsmd/skills/` is missing, every prompt is **`skipped`**, not failed.

### 6. Holdout is a path linter, not scenarios

`evals/holdout/scenarios/` is a README. No satisfaction judge.

Gate:

| Side | Paths |
|---|---|
| Evals | `evals/` and `.github/workflows/evals-holdout.yml` |
| Implementation | `plugins/specsmd/` only |

Mixed → fail. One side → pass. Legacy `plugins/specsmd-*` is not implementation. **`src/__tests__/evals/` is neither side** — later PRs edited those tests in the same commit as the plugin (`74c29ec`, `251cb6a`).

CI uses PR merge-base or `github.event.before`. Zero SHA = no parent. Renames counted with `--no-renames` so `evals/ → plugins/specsmd/` is both sides.

### 7. Shape

Node CommonJS, `js-yaml` from `src/node_modules`. No TypeScript in the harness. No judge model. No scheduled eval execution (that part matches 000’s out-of-scope).

## Why this looks thin

The product asked for: **a real evals holdout that can reject a spec or a mixed PR before the flow is built.**

What shipped: **protocol markdown + a findings recorder + honest `needs-human` for almost every DoD + keyword trigger scoring + a git path linter**, then 000 stamped `cleared` without the second probe.

## If you rewrite evals

- Do it on an **evals-only** commit/branch. Do **not** touch `plugins/specsmd/` in the same contribution.
- If you change contracts later PRs assumed (frontmatter keys, report path, holdout prefixes, trigger outcome shape), you must restack PR2–PR9.
- Safer: leave the stack, add a follow-up evals-only branch off the tip, or rebuild PR1 and cherry-pick / restack.
- Do not mark 000 `cleared` again without actually running the high-complexity protocol the spec describes — or get an explicit human waiver in the spec as named freedom.

## Where to read the code

```bash
git checkout execute-plan/2040fa95-pr-1-evals-and-verifiers
# start here:
evals/README.md
evals/sufficiency/run.cjs
evals/conformance/run.cjs
evals/triggers/run.cjs
evals/holdout/run.cjs
.github/workflows/evals-holdout.yml
```
