# Handoff — coverage floor + autonomous review loop

Branch `main-v2`. Written 2026-08-21 at the end of the session that designed and shipped the autonomous review loop. Read this before continuing that work.

## What shipped

**1. Coverage floor in bolt-execute** (commits `458e234`, `3eaa40c`, pushed 2026-08-16).
Two-tier test rule: gating DoD criteria are test-first (failing check seen failing, recorded in Evidence); every other behavior change carries a covering check, an Evidence line naming the existing cover, or a recorded exemption (vendored/generated). Case classes (acceptance, refusal/error, boundaries, null, replay) are covered or dismissed in one Evidence line. Missing/placeholder engineering Verification rule is a named stop. Four legacy standards templates collapsed into one `engineering.md` with a verification seed.

**2. Autonomous review loop** (this commit set).
- `plugins/specsmd/skills/bolt-review/` — read-only reviewer contract: verify-before-reporting (file:line + nearest check), never writes a fix, does not re-report dispositioned items, load-bearing = correctness or stated requirements only. Templates: `references/brief.md` (per-round brief), `references/review-findings.md` (adjudication ledger).
- `flow-runtime/references/recipes/autonomous.yaml` — plan → implement → test → review with `loop: {max_rounds: 2, reviewers: 1, fresh_context: true, terminates_on: gates}`. Also in `docs/specsmd/recipes/`.
- `bolt-execute` §6 Review loop — per round: regression gate, brief, fresh-context reviewer, adjudicate into ledger (forward-only: `OPEN → FIXED | REFUTED | ACCEPTED`), fix with pinned regression checks. Terminates on three gates: named suite green, an **external anchor** the bolt did not write, all load-bearing findings FIXED/REFUTED. Never terminates on a silent round. Budget expiry with load-bearing OPEN blocks completion; advisory findings survive unscrubbed.
- Contract: bolt fields `review_rounds_completed`, `last_round_verdict`; `recipe.shipped` includes `autonomous`. Transitions doc has a Review loop section.
- Evals (separate commit per the holdout isolation guard): scenarios `complete-refuses-open-load-bearing-finding`, `review-budget-expiry-keeps-findings`; assertions in `skills.test.ts` and `recipes.test.ts`.

**3. One writing standard, and claim provenance** (2026-08-23).
`flow-runtime/references/writing.md` is the single standard for how any specsmd document is written: stateless documents that stand alone, guidance phrased as the action to take, a deliberate slant on wording (neutral by default), the reason carried with the rule, few balanced examples, every claim naming its authority, and delete-to-remove for **prescriptive** documents while walkthroughs, decisions, and `review-findings.md` stay **append-only**. Named by `plan-intent`, `task-decompose`, `bolt-design` (`designing.md`), `bolt-execute` (`implementing.md`), `bolt-review`, `specsmd-init`, and the `flow-runtime` read-first table. It is a plugin reference, deliberately not a shipped project standard — projects tune their own standards, and baseline writing quality is not theirs to drift from. `plan-intent/references/writing.md` became `brief-writing.md` so the general standard and the brief-section guide no longer share a basename. `using-specsmd` gained **Say where it comes from** beside Precedence: name in prose what a claim rests on, separate what was read from what is remembered, mark inference as inference.

**4. Unplanned work is captured back into the artifacts** (2026-08-23).
Ad-hoc work — course corrections, forgotten requirements, small changes made along the way — used to leave the specs describing a bolt the code no longer matched. `bolt-execute` now records each one in the walkthrough's required `## Unplanned changes` table **as it happens**, then places it, tiered by clarity rather than gated: a clear destination inside the bolt (a dated correction on a bolt decision, a Definition of Done line appended to a named task, or a one-off that the row itself records) is written without stopping for approval; work outside the bolt, an ambiguous destination, a `brief.md` change, or a rewrite of an existing gating line is one question with a recommendation first. Dispositions are `captured`, `accepted as-is`, or `open`, and an `open` row blocks completion. Two guardrails keep this from laundering defects into requirements: a gating criterion is never weakened to match what was built, and a caller-visible contract change (return, surfaces, set rule, shape, credential) reopens that hunt through `bolt-design` in either tier rather than being captured. `bolt-review`'s missing-authority hunt now routes a stale artifact to capture instead of demanding a code change. After completion, append a dated row rather than reopening the bolt.

**5. fabriqa-2026 de-linked from this repo.**
`.agents/skills/` there now holds real copies of the nine specsmd skills (was: symlinks into this repo). `.claude/skills/*` and `.codex/skills/*` still symlink internally to `.agents/skills/*`. `autonomous.yaml` added to its `docs/specsmd/recipes/`. fabriqa is self-contained on any machine; it picks up specsmd changes only by re-copy:

    cd ~/code/fabriqa-workspace/fabriqa-2026 && SRC=~/code/fabriqa-workspace/specs.md/plugins/specsmd/skills; for name in bolt-design bolt-execute flow-runtime plan-intent specsmd-init specsmd-status task-decompose using-specsmd bolt-review; do rm -rf ".agents/skills/$name" && cp -R "$SRC/$name" ".agents/skills/$name"; done; find .agents/skills -name '.DS_Store' -delete

## User-locked decisions

One reviewer per round, no external-model driving (the skill generates briefs; the user runs external reviewers by hand when wanted). Recipe named `autonomous`, skill named `bolt-review`. No spec-gap stop inside implement — sufficiency belongs to plan-intent/bolt-design.

## Why the loop closes on gates, not clean rounds

Research (three reports in the 2026-08-16 session): reviewer-silence termination has no empirical support — a reviewer prompted to find gaps always finds some, and with a noisy verifier "reported acceptance keeps rising while true validity falls" (Wu et al. 2026). Two repair rounds capture 76–95% of achievable gains. Fresh context per round counters self-conditioning. The external-anchor gate encodes the fabriqa bolt-006 failure: a four-reviewer fleet went green because every suite proved behavior against the wrong schema; only an oracle outside the loop caught it.

## Deferred / next

- **Layer 3 `bolt-marathon`** — intent-level orchestration walking the ready frontier of `tasks.md` (open tasks with terminal `depends_on`), one context per sequential chain, fan-out only for independent slices. Deliberately deferred until `autonomous` survives real bolts.
- **Dogfood**: run the next fabriqa bolt with `recipe: autonomous`; compare its ledger against bolt-006's hand-rolled `review-findings.md`.
- **CI**: the "Evals holdout isolation" push job can sit queued for hours on the `blacksmith-4vcpu-ubuntu-2404` runner — check the runner pool. On bulk pushes the job evaluates the whole pushed range, which is historically mixed (pre-existing; not fixable by commit ordering).
- **Committing here**: evals/** and plugins/specsmd/** must land as separate commits (`src/__tests__/evals/holdout-isolation.test.ts` enforces it).
